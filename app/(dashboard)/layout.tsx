"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, Button, Dropdown, Layout, Nav, Toast } from "@douyinfe/semi-ui";
import {
	IconBell,
	IconHelpCircle,
	IconHome,
	IconMapPin,
	IconMenu,
	IconMoon,
	IconSemiLogo,
	IconSun,
	IconUser,
	IconUserGroup,
} from "@douyinfe/semi-icons";
import { authClient } from "@/lib/auth-client";

const { Header, Sider, Content, Footer } = Layout;

const sideMenuItems = [
	{ itemKey: "dashboard", text: "仪表盘", icon: <IconHome size="large" /> },
	{ itemKey: "student", text: "学生管理", icon: <IconUserGroup size="large" /> },
	{ itemKey: "insight", text: "学生地图", icon: <IconMapPin size="large" /> },
	{ itemKey: "user", text: "用户管理", icon: <IconUser size="large" /> },
];

const menuRoutes = {
	dashboard: "/",
	student: "/student",
	insight: "/insight",
	user: "/user",
} as const;

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const pathname = usePathname();
	const [siderVisible, setSiderVisible] = useState(false);
	const [theme, setTheme] = useState<"light" | "dark">(() =>
		typeof document !== "undefined" && document.body.getAttribute("theme-mode") === "dark" ? "dark" : "light",
	);

	const toggleTheme = () => {
		const nextTheme = theme === "dark" ? "light" : "dark";
		setTheme(nextTheme);

		if (nextTheme === "dark") {
			document.body.setAttribute("theme-mode", "dark");
		} else {
			document.body.removeAttribute("theme-mode");
		}
	};

	const handleSignOut = async () => {
		try {
			const { error } = await authClient.signOut();

			if (error) {
				Toast.error(error.message ?? "退出登录失败，请稍后重试");
				return;
			}

			router.replace("/login");
			router.refresh();
		} catch {
			Toast.error("退出登录失败，请稍后重试");
		}
	};

	const handleMenuSelect = ({ itemKey }: { itemKey: string | number }) => {
		const route = menuRoutes[itemKey as keyof typeof menuRoutes];

		if (route && pathname !== route) {
			router.push(route);
		}

		setSiderVisible(false);
	};

	const selectedMenuKey = pathname.startsWith("/student")
		? "student"
		: pathname.startsWith("/insight")
			? "insight"
			: pathname.startsWith("/user")
				? "user"
				: "dashboard";

	return (
		<Layout className="h-dvh overflow-hidden">
			<Header className="shrink-0 bg-(--semi-color-bg-1)">
				<Nav mode="horizontal">
					<Nav.Header>
						<Button
							theme="borderless"
							icon={<IconMenu size="large" />}
							className="mr-2 md:hidden!"
							style={{ color: "var(--semi-color-text-2)" }}
							aria-label="打开侧边栏"
							onClick={() => setSiderVisible((visible) => !visible)}
						/>
						<IconSemiLogo className="text-(--semi-color-text-0)" style={{ height: "36px", fontSize: 36 }} />
						<span className="ml-2 hidden text-lg font-semibold text-(--semi-color-text-0) md:inline">
							Student Atlas
						</span>
					</Nav.Header>
					<Nav.Footer>
						<Button
							theme="borderless"
							icon={theme === "dark" ? <IconSun size="large" /> : <IconMoon size="large" />}
							style={{ color: "var(--semi-color-text-2)", marginRight: "12px" }}
							aria-label="切换主题"
							onClick={toggleTheme}
						/>
						<Button
							theme="borderless"
							icon={<IconBell size="large" />}
							style={{ color: "var(--semi-color-text-2)", marginRight: "12px" }}
							aria-label="通知"
						/>
						<Button
							theme="borderless"
							icon={<IconHelpCircle size="large" />}
							style={{ color: "var(--semi-color-text-2)", marginRight: "12px" }}
							aria-label="帮助中心"
						/>
						<Dropdown
							position="bottomRight"
							render={
								<Dropdown.Menu>
									<Dropdown.Item icon={<IconUser />} onClick={() => router.push("/user")}>
										个人信息
									</Dropdown.Item>
									<Dropdown.Item onClick={() => void handleSignOut()}>退出登录</Dropdown.Item>
								</Dropdown.Menu>
							}
						>
							<span>
								<Avatar color="orange" size="small" alt="Student Atlas">
									S
								</Avatar>
							</span>
						</Dropdown>
					</Nav.Footer>
				</Nav>
			</Header>

			<Layout className="min-h-0 flex-1 overflow-hidden">
				<Sider className="hidden! shrink-0 bg-(--semi-color-bg-1) md:block!">
					<Nav
						style={{ maxWidth: 220, height: "100%" }}
						selectedKeys={[selectedMenuKey]}
						items={sideMenuItems}
						onSelect={handleMenuSelect}
						footer={{
							collapseButton: true,
							collapseText: (collapsed) => (collapsed ? "展开侧边栏" : "收起侧边栏"),
						}}
					/>
				</Sider>

				<Content className="overflow-auto bg-(--semi-color-bg-0) p-4 md:p-6">{children}</Content>
			</Layout>

			<Footer className="flex shrink-0 flex-col items-center justify-between gap-2 border-t border-(--semi-color-border) bg-(--semi-color-bg-1) px-5 py-4 text-(--semi-color-text-2) sm:flex-row">
				<span className="text-sm">Copyright &copy; 2026 Student Atlas. All Rights Reserved.</span>
				<span className="flex gap-6 text-sm">
					<span>帮助中心</span>
					<span>反馈建议</span>
				</span>
			</Footer>

			{siderVisible ? (
				<div
					className="fixed inset-0 top-15 z-40 bg-black/30 md:hidden"
					onClick={() => setSiderVisible(false)}
					role="presentation"
				/>
			) : null}

			<div
				className={`fixed left-0 top-15 z-50 h-[calc(100dvh-60px)] w-55 bg-(--semi-color-bg-1) shadow-lg transition-transform duration-200 md:hidden ${
					siderVisible ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<Nav
					style={{ maxWidth: 220, height: "100%" }}
					selectedKeys={[selectedMenuKey]}
					items={sideMenuItems}
					onSelect={handleMenuSelect}
				/>
			</div>
		</Layout>
	);
}
