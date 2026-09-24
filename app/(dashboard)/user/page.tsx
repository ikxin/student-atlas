import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserManagement } from "./user-management";

export const metadata: Metadata = {
	title: "用户管理 - Student Atlas",
	description: "管理当前登录账户",
};

export default async function UserPage() {
	const session = await auth.api.getSession({ headers: await headers() });

	if (!session) {
		redirect("/login");
	}

	return <UserManagement />;
}
