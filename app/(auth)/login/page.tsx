import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
	title: "登录 - Student Atlas",
	description: "登录 Student Atlas",
};

export default function LoginPage() {
	return (
		<main className="grid min-h-dvh bg-(--semi-color-bg-0) text-(--semi-color-text-0) lg:grid-cols-[minmax(0,1fr)_480px]">
			<section className="hidden min-h-0 flex-col justify-between border-r border-(--semi-color-border) bg-(--semi-color-bg-1) p-10 lg:flex">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-semibold text-white">S</div>
					<div>
						<p className="text-base font-semibold">Student Atlas</p>
						<p className="text-sm text-(--semi-color-text-2)">Vinext Cloudflare 应用</p>
					</div>
				</div>

				<div className="max-w-xl">
					<p className="mb-4 text-sm font-medium text-blue-600">工作台登录</p>
					<h1 className="text-4xl font-semibold leading-tight">管理入口，保持清晰高效。</h1>
					<p className="mt-5 max-w-lg text-base leading-7 text-(--semi-color-text-2)">
						使用已有账户的邮箱和密码登录，继续访问 Student Atlas 管理工作台。
					</p>
				</div>

				<p className="text-sm text-(--semi-color-text-2)">Copyright &copy; {new Date().getFullYear()} Student Atlas. All Rights Reserved.</p>
			</section>

			<section className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6 lg:min-h-0 lg:px-10">
				<div className="w-full max-w-sm">
					<div className="mb-8 lg:hidden">
						<div className="mb-5 flex items-center gap-3">
							<div className="flex size-10 items-center justify-center rounded-lg bg-blue-600 text-lg font-semibold text-white">S</div>
							<div>
								<p className="text-base font-semibold">Student Atlas</p>
								<p className="text-sm text-(--semi-color-text-2)">Vinext Cloudflare 应用</p>
							</div>
						</div>
						<h1 className="text-2xl font-semibold">欢迎回来</h1>
						<p className="mt-2 text-sm text-(--semi-color-text-2)">使用邮箱和密码登录管理工作台。</p>
					</div>

					<div className="rounded-lg border border-(--semi-color-border) bg-(--semi-color-bg-1) p-6 shadow-sm sm:p-8">
						<LoginForm />

						<p className="mt-6 text-center text-sm text-(--semi-color-text-2)">
							<Link href="/" className="font-medium text-blue-600 hover:text-blue-700">
								返回首页
							</Link>
						</p>
					</div>
				</div>
			</section>
		</main>
	);
}
