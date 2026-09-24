import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentMap } from "./student-map";

export const metadata: Metadata = {
	title: "学生地图 - Student Atlas",
	description: "查看学生地理分布",
};

export default async function InsightPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	return <StudentMap />;
}
