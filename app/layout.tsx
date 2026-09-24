import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
	title: "Student Atlas",
	description: "高校学生数据管理与地理洞察工作台",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="zh-CN" className="min-h-full bg-(--semi-color-bg-0)">
			<body className="min-h-full bg-(--semi-color-bg-0)">{children}</body>
		</html>
	);
}
