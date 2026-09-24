"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, Button, Empty, Input, SideSheet, Spin, Tag, Typography } from "@douyinfe/semi-ui";
import { IconMapPin, IconRefresh, IconSearch } from "@douyinfe/semi-icons";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";
import type { InsightResponse, InsightStudent } from "@/types/insight";

const { Text, Title } = Typography;
const SOURCE_ID = "student-locations";
const SOURCE_LAYER_ID = "student-location-source-layer";
const CLUSTER_RADIUS = 40;
const EMPTY_RESPONSE: InsightResponse = {
	data: [],
	summary: { totalStudents: 0, locatedStudents: 0, unlocatedStudents: 0 },
};

type StudentLocation = {
	key: string;
	longitude: number;
	latitude: number;
	students: InsightStudent[];
	label: string;
	address: string;
};

type LocationFeatureCollection = {
	type: "FeatureCollection";
	features: Array<{
		type: "Feature";
		geometry: { type: "Point"; coordinates: [number, number] };
		properties: {
			locationKey: string;
			studentCount: number;
		};
	}>;
};

function getStudentAddress(student: InsightStudent) {
	if (student.addressTitle?.trim()) {
		return student.addressTitle.trim();
	}

	return [
		student.addressProvince,
		student.addressCity,
		student.addressDistrict,
		student.addressStreet,
		student.addressHouseNumber,
	]
		.filter((part): part is string => Boolean(part?.trim()))
		.join("") || "地址信息未完善";
}

function getLocationLabel(students: InsightStudent[]) {
	if (students.length <= 3) {
		return students.map((student) => student.name).join("、");
	}

	return `${students
		.slice(0, 2)
		.map((student) => student.name)
		.join("、")}等 ${students.length} 人`;
}

function groupStudents(students: InsightStudent[]) {
	const grouped = new globalThis.Map<string, StudentLocation>();

	for (const student of students) {
		const key = `${student.longitude.toFixed(6)},${student.latitude.toFixed(6)}`;
		const location = grouped.get(key);

		if (location) {
			location.students.push(student);
			continue;
		}

		grouped.set(key, {
			key,
			longitude: student.longitude,
			latitude: student.latitude,
			students: [student],
			label: student.name,
			address: getStudentAddress(student),
		});
	}

	return Array.from(grouped.values()).map((location) => ({
		...location,
		label: getLocationLabel(location.students),
	}));
}

function toFeatureCollection(locations: StudentLocation[]): LocationFeatureCollection {
	return {
		type: "FeatureCollection",
		features: locations.map((location) => ({
			type: "Feature",
			geometry: {
				type: "Point",
				coordinates: [location.longitude, location.latitude],
			},
			properties: {
				locationKey: location.key,
				studentCount: location.students.length,
			},
		})),
	};
}

function fitMapToLocations(map: MapLibreMap, locations: StudentLocation[]) {
	if (locations.length === 0) {
		return;
	}

	if (locations.length === 1) {
		map.easeTo({ center: [locations[0].longitude, locations[0].latitude], zoom: 13, duration: 500 });
		return;
	}

	const bounds = new maplibregl.LngLatBounds();
	for (const location of locations) {
		bounds.extend([location.longitude, location.latitude]);
	}

	const padding = map.getContainer().clientWidth < 640 ? 28 : 64;
	map.fitBounds(bounds, { padding, maxZoom: 13, duration: 500 });
}

function createClusterMarker(count: number, onClick: (event: MouseEvent) => void) {
	const element = document.createElement("button");
	element.type = "button";
	element.className =
		"flex min-h-9 max-w-56 items-center gap-2 rounded-full border border-white/90 bg-(--semi-color-bg-2) px-3 py-2 text-left text-xs font-medium text-(--semi-color-text-0) shadow-lg transition-shadow hover:shadow-xl";
	element.title = `展开 ${count} 名学生`;
	element.setAttribute("aria-label", `展开 ${count} 名学生`);

	const pin = document.createElement("span");
	pin.className = "h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 ring-2 ring-blue-100";
	element.appendChild(pin);

	const label = document.createElement("span");
	label.className = "truncate";
	label.textContent = "学生分布";
	element.appendChild(label);

	const badge = document.createElement("span");
	badge.className = "shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700";
	badge.textContent = String(count);
	element.appendChild(badge);

	element.addEventListener("click", onClick);

	return {
		element,
		setNames(names: string[]) {
			if (names.length === 0) {
				label.textContent = `${count} 名学生`;
				return;
			}

			const nameText = names.join("、");
			const displayName = count > names.length ? `${nameText}等` : nameText;
			label.textContent = displayName;
			element.title = `${nameText}，共 ${count} 名学生`;
			element.setAttribute("aria-label", `展开 ${displayName} ${count} 名学生`);
		},
	};
}

function createLocationMarker(location: StudentLocation, onClick: (event: MouseEvent) => void) {
	const element = document.createElement("button");
	element.type = "button";
	element.className =
		"flex min-h-9 max-w-56 items-center gap-2 rounded-full border border-white/90 bg-(--semi-color-bg-2) px-3 py-2 text-left text-xs font-medium text-(--semi-color-text-0) shadow-lg transition-shadow hover:shadow-xl";
	element.title = `${location.label} · ${location.address}`;
	element.setAttribute("aria-label", `查看 ${location.label} 的地点详情`);

	const pin = document.createElement("span");
	pin.className = "h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600 ring-2 ring-blue-100";
	element.appendChild(pin);

	const label = document.createElement("span");
	label.className = "truncate";
	label.textContent = location.label;
	element.appendChild(label);

	if (location.students.length > 1) {
		const count = document.createElement("span");
		count.className = "shrink-0 rounded-full bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700";
		count.textContent = String(location.students.length);
		element.appendChild(count);
	}

	element.addEventListener("click", onClick);
	return element;
}

function MapCanvas({
	locations,
	focusResults,
	onSelect,
}: {
	locations: StudentLocation[];
	focusResults: boolean;
	onSelect: (location: StudentLocation | null) => void;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<MapLibreMap | null>(null);
	const markersRef = useRef(new globalThis.Map<string, MapLibreMarker>());
	const locationsRef = useRef(new globalThis.Map<string, StudentLocation>());
	const dataRef = useRef<LocationFeatureCollection>(toFeatureCollection(locations));
	const hasFittedInitialDataRef = useRef(false);
	const onSelectRef = useRef(onSelect);

	useEffect(() => {
		onSelectRef.current = onSelect;
	}, [onSelect]);

	useEffect(() => {
		locationsRef.current = new globalThis.Map(locations.map((location) => [location.key, location]));
		dataRef.current = toFeatureCollection(locations);
		const map = mapRef.current;

		if (!map) {
			return;
		}

		for (const marker of markersRef.current.values()) {
			marker.remove();
		}
		markersRef.current.clear();
		const source = map.getSource(SOURCE_ID);

		if (source instanceof maplibregl.GeoJSONSource) {
			source.setData(dataRef.current);

			if (locations.length > 0 && (focusResults || !hasFittedInitialDataRef.current)) {
				fitMapToLocations(map, locations);
				hasFittedInitialDataRef.current = true;
			}
		}
	}, [focusResults, locations]);

	useEffect(() => {
		if (!containerRef.current) {
			return;
		}

		const container = containerRef.current;
		const map = new maplibregl.Map({
			container,
			style: {
				version: 8,
				sources: {
					openstreetmap: {
						type: "raster",
						tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
						tileSize: 256,
						maxzoom: 19,
						attribution:
							'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
					},
				},
				layers: [{ id: "openstreetmap", type: "raster", source: "openstreetmap" }],
			},
			center: [104.1954, 35.8617],
			zoom: 3,
			minZoom: 2,
			maxZoom: 19,
			attributionControl: false,
		});
		mapRef.current = map;
		map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
		map.addControl(new maplibregl.ScaleControl({ unit: "metric", maxWidth: 100 }), "bottom-left");
		map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");
		const resizeObserver = new ResizeObserver(() => map.resize());
		resizeObserver.observe(container);

		const syncMarkers = () => {
			if (!map.getSource(SOURCE_ID) || !map.isSourceLoaded(SOURCE_ID)) {
				return;
			}

			const visibleKeys = new Set<string>();
			const features = map.querySourceFeatures(SOURCE_ID);

			for (const feature of features) {
				if (feature.geometry.type !== "Point") {
					continue;
				}

				const coordinates = feature.geometry.coordinates as [number, number];
				const properties = feature.properties;
				const isCluster = Boolean(properties.cluster);
				const markerKey = isCluster ? `cluster-${String(properties.cluster_id)}` : `location-${String(properties.locationKey)}`;

				if (visibleKeys.has(markerKey)) {
					continue;
				}
				visibleKeys.add(markerKey);

				const existingMarker = markersRef.current.get(markerKey);
				if (existingMarker) {
					existingMarker.setLngLat(coordinates);
					continue;
				}

				if (isCluster) {
					const clusterId = Number(properties.cluster_id);
					const studentCount = Number(properties.studentTotal ?? properties.point_count);
					const clusterMarker = createClusterMarker(studentCount, (event) => {
						event.stopPropagation();
						const source = map.getSource(SOURCE_ID);

						if (source instanceof maplibregl.GeoJSONSource) {
							void source
								.getClusterExpansionZoom(clusterId)
								.then((zoom) => map.easeTo({ center: coordinates, zoom, duration: 450 }))
								.catch(() => undefined);
						}
					});
					const marker = new maplibregl.Marker({ element: clusterMarker.element, anchor: "bottom", offset: [0, -4] })
						.setLngLat(coordinates)
						.addTo(map);
					markersRef.current.set(markerKey, marker);
					const source = map.getSource(SOURCE_ID);

					if (source instanceof maplibregl.GeoJSONSource) {
						void source
							.getClusterLeaves(clusterId, 2, 0)
							.then((leaves) => {
								if (markersRef.current.get(markerKey) !== marker) {
									return;
								}

								const names = leaves
									.flatMap((leaf) => {
										const locationKey = String(leaf.properties?.locationKey ?? "");
										return locationsRef.current.get(locationKey)?.students.map((student) => student.name) ?? [];
									})
									.slice(0, 2);
								clusterMarker.setNames(names);
							})
							.catch(() => clusterMarker.setNames([]));
					}
					continue;
				}

				const locationKey = String(properties.locationKey);
				const location = locationsRef.current.get(locationKey);

				if (!location) {
					continue;
				}

				const element = createLocationMarker(location, (event) => {
					event.stopPropagation();
					onSelectRef.current(locationsRef.current.get(locationKey) ?? null);
				});
				markersRef.current.set(
					markerKey,
					new maplibregl.Marker({ element, anchor: "bottom", offset: [0, -4] }).setLngLat(coordinates).addTo(map),
				);
			}

			for (const [key, marker] of markersRef.current) {
				if (!visibleKeys.has(key)) {
					marker.remove();
					markersRef.current.delete(key);
				}
			}
		};

		map.on("load", () => {
			map.addSource(SOURCE_ID, {
				type: "geojson",
				data: dataRef.current,
				cluster: true,
				clusterRadius: CLUSTER_RADIUS,
				clusterMaxZoom: 15,
				clusterProperties: {
					studentTotal: ["+", ["get", "studentCount"]],
				},
			});
			map.addLayer({
				id: SOURCE_LAYER_ID,
				type: "circle",
				source: SOURCE_ID,
				paint: { "circle-radius": 1, "circle-opacity": 0 },
			});
			const initialLocations = Array.from(locationsRef.current.values());

			if (initialLocations.length > 0) {
				fitMapToLocations(map, initialLocations);
				hasFittedInitialDataRef.current = true;
			}
		});
		map.on("idle", syncMarkers);
		map.on("click", () => onSelectRef.current(null));

		return () => {
			resizeObserver.disconnect();
			for (const marker of markersRef.current.values()) {
				marker.remove();
			}
			markersRef.current.clear();
			map.remove();
			mapRef.current = null;
		};
	}, []);

	return (
		<div className="absolute inset-0">
			<div ref={containerRef} className="h-full w-full" aria-label="学生地理分布地图" />
		</div>
	);
}

export function StudentMap() {
	const router = useRouter();
	const [response, setResponse] = useState<InsightResponse>(EMPTY_RESPONSE);
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const [search, setSearch] = useState("");
	const [reloadKey, setReloadKey] = useState(0);
	const [selectedLocation, setSelectedLocation] = useState<StudentLocation | null>(null);
	const deferredSearch = useDeferredValue(search.trim().toLocaleLowerCase("zh-CN"));

	useEffect(() => {
		const controller = new AbortController();

		const loadLocations = async () => {
			setIsLoading(true);
			setHasError(false);
			setSelectedLocation(null);

			try {
				const result = await fetch("/api/insight", { cache: "no-store", signal: controller.signal });

				if (result.status === 401) {
					router.replace("/login");
					router.refresh();
					return;
				}

				if (!result.ok) {
					throw new Error("学生地图数据加载失败");
				}

				setResponse((await result.json()) as InsightResponse);
			} catch (error) {
				if (error instanceof DOMException && error.name === "AbortError") {
					return;
				}

				setHasError(true);
			} finally {
				if (!controller.signal.aborted) {
					setIsLoading(false);
				}
			}
		};

		void loadLocations();
		return () => controller.abort();
	}, [reloadKey, router]);

	const filteredStudents = useMemo(() => {
		if (!deferredSearch) {
			return response.data;
		}

		return response.data.filter((student) =>
			[
				student.name,
				student.studentNumber,
				student.departmentName,
				student.majorName,
				student.className,
				getStudentAddress(student),
			]
				.filter((value): value is string => Boolean(value))
				.some((value) => value.toLocaleLowerCase("zh-CN").includes(deferredSearch)),
		);
	}, [deferredSearch, response.data]);
	const locations = useMemo(() => groupStudents(filteredStudents), [filteredStudents]);

	return (
		<main className="flex h-full min-h-140 w-full flex-col gap-4">
			<header className="flex shrink-0 flex-col gap-1">
				<Title heading={3}>学生地图</Title>
				<Text type="secondary">查看学生地理分布与地点明细。</Text>
			</header>

			<div className="flex shrink-0 flex-col justify-between gap-3 sm:flex-row sm:items-center">
				<Input
					className="w-full sm:max-w-md"
					prefix={<IconSearch />}
					placeholder="搜索姓名、学号、院系、专业或地址"
					showClear
					value={search}
					onChange={setSearch}
				/>
				<div className="flex flex-wrap items-center gap-2">
					<Tag color="green">
						{deferredSearch ? `匹配 ${filteredStudents.length} 人` : `已定位 ${response.summary.locatedStudents} 人`}
					</Tag>
					<Tag color="orange">{locations.length} 个地点</Tag>
					{response.summary.unlocatedStudents > 0 ? <Tag>未定位 {response.summary.unlocatedStudents} 人</Tag> : null}
					<Button
						aria-label="刷新学生地图"
						disabled={isLoading}
						icon={<IconRefresh />}
						theme="borderless"
						title="刷新"
						onClick={() => setReloadKey((current) => current + 1)}
					/>
				</div>
			</div>

			<section className="relative min-h-100 flex-1 overflow-hidden rounded-lg border border-(--semi-color-border) bg-(--semi-color-bg-1)">
				<MapCanvas locations={locations} focusResults={Boolean(deferredSearch)} onSelect={setSelectedLocation} />

				{isLoading ? (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-(--semi-color-bg-0)">
						<Spin size="large" />
					</div>
				) : null}

				{hasError ? (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-(--semi-color-bg-0) p-6">
						<Empty
							description="学生地图数据加载失败"
							title="暂时无法加载"
						>
							<Button icon={<IconRefresh />} theme="solid" type="primary" onClick={() => setReloadKey((current) => current + 1)}>
								重新加载
							</Button>
						</Empty>
					</div>
				) : null}

				{!isLoading && !hasError && locations.length === 0 ? (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-(--semi-color-bg-0) p-6">
						<Empty title="没有匹配的学生地点" description="请更换搜索条件" />
					</div>
				) : null}
			</section>

			<SideSheet
				visible={Boolean(selectedLocation)}
				title={selectedLocation ? `${selectedLocation.students.length} 名学生` : "地点详情"}
				width="min(420px, 100vw)"
				onCancel={() => setSelectedLocation(null)}
			>
				{selectedLocation ? <LocationDetailsContent location={selectedLocation} /> : null}
			</SideSheet>
		</main>
	);
}

function LocationDetailsContent({ location }: { location: StudentLocation }) {
	return (
		<div className="flex flex-col">
			<div className="border-b border-(--semi-color-border) pb-5">
				<div className="flex items-start gap-3">
					<IconMapPin className="mt-0.5 shrink-0 text-blue-600" size="large" />
					<div className="min-w-0">
						<div className="font-medium text-(--semi-color-text-0)">{location.address}</div>
						<Text type="tertiary">
							{location.longitude.toFixed(6)}, {location.latitude.toFixed(6)}
						</Text>
					</div>
				</div>
			</div>

			{location.students.map((student) => (
				<article key={student.id} className="flex gap-3 border-b border-(--semi-color-border) py-5 last:border-b-0">
					<Avatar color="blue" size="small">
						{student.name.slice(0, 1)}
					</Avatar>
					<div className="min-w-0 flex-1">
						<div className="flex flex-wrap items-center gap-2">
							<span className="font-semibold text-(--semi-color-text-0)">{student.name}</span>
							<Tag color="blue">{student.grade} 级</Tag>
						</div>
						<dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
							<div>
								<dt className="text-(--semi-color-text-2)">学号</dt>
								<dd className="m-0 mt-0.5 text-(--semi-color-text-0)">{student.studentNumber || "-"}</dd>
							</div>
							<div>
								<dt className="text-(--semi-color-text-2)">班级</dt>
								<dd className="m-0 mt-0.5 text-(--semi-color-text-0)">{student.className || "-"}</dd>
							</div>
							<div className="sm:col-span-2">
								<dt className="text-(--semi-color-text-2)">院系与专业</dt>
								<dd className="m-0 mt-0.5 wrap-break-word text-(--semi-color-text-0)">
									{student.departmentName} · {student.majorName}
								</dd>
							</div>
						</dl>
					</div>
				</article>
			))}
		</div>
	);
}
