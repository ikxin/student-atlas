import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentList } from "./student-list";

export const metadata: Metadata = {
	title: "学生管理 - Student Atlas",
	description: "查询学生信息",
};

export default async function StudentPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	return <StudentList />;
}
