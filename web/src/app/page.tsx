import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe2, Link2, MessageCircleMore, PackageOpen, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const coreBenefits = [
  {
    title: "一个链接，完整交付",
    text: "不用再一张一张发图，把整套产品图、模特图、案例图整理成一个专业的相册链接。",
    icon: Link2,
  },
  {
    title: "展示更专业",
    text: "比聊天窗口发图更整洁、更高级，让客户第一眼就感受到品牌与团队的专业度。",
    icon: Globe2,
  },
  {
    title: "支持外链转化",
    text: "可挂独立站、TikTok、WhatsApp 等跳转链接，让客户在浏览图片时直接进入联系与成交路径。",
    icon: MessageCircleMore,
  },
  {
    title: "分类管理更轻松",
    text: "按客户、品牌、产品、主题建立相册，图片整理、查找、复用和长期沉淀都更轻松。",
    icon: PackageOpen,
  },
  {
    title: "权限灵活可控",
    text: "支持公开、加密、私有三种模式，适合公开展示、客户专属图册和未公开素材。",
    icon: ShieldCheck,
  },
  {
    title: "批量交付更高效",
    text: "支持批量上传、批量复制图片链接，让图册交付和站外分发都更省时间。",
    icon: CheckCircle2,
  },
];

const useCases = [
  "跨境卖家给客户展示产品图、模特图、选品图",
  "摄影工作室交付作品集与客户图册",
  "服装、饰品、箱包商家按系列分类展示素材",
  "独立站运营团队批量管理图片并复制直链",
  "品牌方或工作室打造更专业的客户展示入口",
];

const workflow = [
  {
    step: "01",
    title: "创建相册",
    text: "按客户、产品或主题快速创建专属图册。",
  },
  {
    step: "02",
    title: "上传并整理图片",
    text: "把零散素材整理到统一相册中，建立更清晰的展示结构。",
  },
  {
    step: "03",
    title: "分享链接并承接转化",
    text: "把相册链接发给客户，客户浏览后可直接跳转到你的站点或联系方式。",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f4f1e7_0%,#f8f6ef_24%,#ffffff_62%,#f6f2ea_100%)] text-zinc-900">
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 opacity-70">
          <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-amber-200/35 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-zinc-200/50 blur-3xl" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-14 px-6 py-10 lg:px-10 lg:py-14">
          <header className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.36em] text-zinc-500">Xiangce</p>
              <h1 className="mt-2 text-lg font-semibold text-zinc-900">专业图册交付系统</h1>
            </div>
            <nav className="hidden items-center gap-3 sm:flex">
              <Button asChild variant="outline">
                <Link href="/login">登录后台</Link>
              </Button>
              <Button asChild>
                <Link href="/register">立即开始</Link>
              </Button>
            </nav>
          </header>

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr),minmax(0,0.9fr)] lg:items-center">
            <div className="space-y-8">
              <div className="space-y-5">
                <div className="inline-flex rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-sm text-zinc-600 shadow-sm backdrop-blur">
                  从聊天窗口发图，升级到专业图册交付
                </div>
                <h2 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  别再一张一张发图了，<br className="hidden sm:block" />发一个链接就够了
                </h2>
                <p className="max-w-2xl text-lg leading-8 text-zinc-600">
                  把产品图、模特图、案例图整理成一个专业的在线相册链接，支持独立站、TikTok、WhatsApp 等跳转，
                  让客户浏览更舒服，沟通更高效，展示更专业。
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="rounded-full px-7">
                  <Link href="/register">
                    立即创建相册
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-7 bg-white/80">
                  <Link href="/albums/demo">查看演示相册</Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">专业展示</p>
                  <p className="mt-2 text-sm text-zinc-700">让客户看到的是完整的展示页，而不是零散聊天记录。</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">高效交付</p>
                  <p className="mt-2 text-sm text-zinc-700">一个链接完成整套图片交付，减少重复发送和补图沟通。</p>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">承接转化</p>
                  <p className="mt-2 text-sm text-zinc-700">支持外链，把浏览行为自然引导到咨询、社媒和成交入口。</p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_top,#e5d8b7,transparent_55%)] opacity-70 blur-2xl" />
              <div className="relative rounded-[2rem] border border-zinc-200/80 bg-white/90 p-4 shadow-[0_30px_80px_rgba(24,24,27,0.12)] backdrop-blur">
                <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Public Album</p>
                      <h3 className="mt-2 text-2xl font-semibold">Nike Campaign</h3>
                    </div>
                    <div className="flex gap-2">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">Website</span>
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600">WhatsApp</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="aspect-square rounded-2xl bg-[linear-gradient(180deg,#c9ced6,#9299a6)]" />
                    <div className="aspect-square rounded-2xl bg-[linear-gradient(180deg,#d8c4a8,#b08863)]" />
                    <div className="aspect-square rounded-2xl bg-[linear-gradient(180deg,#c5d8e5,#85a7bf)]" />
                    <div className="aspect-square rounded-2xl bg-[linear-gradient(180deg,#d8e1d0,#90ad8f)]" />
                    <div className="aspect-square rounded-2xl bg-[linear-gradient(180deg,#e3d7c4,#ba9f7e)]" />
                    <div className="aspect-square rounded-2xl bg-[linear-gradient(180deg,#d6d5d3,#a7a4a0)]" />
                  </div>

                  <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                    统一展示、分类清晰、可直接分享给客户浏览。
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-red-100 bg-red-50/70 p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-red-500">传统方式</p>
            <h3 className="mt-3 text-2xl font-semibold">一张张发图，效率低，体验差</h3>
            <ul className="mt-6 space-y-4 text-zinc-700">
              <li>一张张发送图片，费时费力</li>
              <li>聊天窗口里图片零散混乱</li>
              <li>客户难以集中浏览、筛选和保存</li>
              <li>发图后无法顺手跳转到你的站点和联系方式</li>
              <li>整体交付体验不专业，也不利于转化</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-600">使用 Xiangce</p>
            <h3 className="mt-3 text-2xl font-semibold">一个链接完成展示、沟通与承接</h3>
            <ul className="mt-6 space-y-4 text-zinc-700">
              <li>一个相册链接，集中展示整套内容</li>
              <li>页面整洁有序，更像正式作品集或产品册</li>
              <li>支持独立站、TikTok、WhatsApp 等外链跳转</li>
              <li>客户浏览更舒服，反馈更直接</li>
              <li>从“发图”升级到“专业交付入口”</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">核心优势</p>
          <h3 className="mt-3 text-4xl font-semibold tracking-tight">不只是发图更方便，而是整个交付方式都更专业</h3>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {coreBenefits.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-5 text-xl font-semibold">{item.title}</h4>
                <p className="mt-3 leading-7 text-zinc-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),420px] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">适用场景</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight">适合所有需要频繁给客户发图片的业务</h3>
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {useCases.map((item) => (
                <div key={item} className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
                  <p className="text-zinc-700">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">为什么客户更喜欢这种方式</p>
            <div className="mt-6 space-y-5">
              <div>
                <h4 className="font-semibold">浏览更集中</h4>
                <p className="mt-2 text-zinc-600">客户不需要在聊天记录里反复翻找图片，打开链接即可完整查看。</p>
              </div>
              <div>
                <h4 className="font-semibold">展示更像品牌内容</h4>
                <p className="mt-2 text-zinc-600">页面感更强，图片更整齐，更接近作品集与产品手册体验。</p>
              </div>
              <div>
                <h4 className="font-semibold">更容易引导下一步动作</h4>
                <p className="mt-2 text-zinc-600">客户看完图后可以直接进入你的独立站、社媒或 WhatsApp，不再中断。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="rounded-[2rem] border border-zinc-200 bg-white px-6 py-8 shadow-sm lg:px-8 lg:py-10">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">使用流程</p>
            <h3 className="mt-3 text-4xl font-semibold tracking-tight">从发图到成交，只需要三步</h3>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {workflow.map((item) => (
              <div key={item.step} className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-6">
                <p className="text-sm font-semibold text-zinc-400">{item.step}</p>
                <h4 className="mt-3 text-xl font-semibold">{item.title}</h4>
                <p className="mt-3 leading-7 text-zinc-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-18 lg:px-10">
        <div className="rounded-[2.5rem] border border-zinc-200 bg-[linear-gradient(135deg,#ffffff_0%,#f3eee4_100%)] px-6 py-12 text-center shadow-sm lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-zinc-500">开始使用</p>
          <h3 className="mt-4 text-4xl font-semibold tracking-tight">把你的图片交付方式，升级成专业展示入口</h3>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-zinc-600">
            不再零散发图，不再让客户在聊天记录里翻图片。用一个链接，把展示、沟通和转化连接起来。
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full px-7">
              <Link href="/register">立即开始使用</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full bg-white/80 px-7">
              <Link href="/login">进入后台</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
