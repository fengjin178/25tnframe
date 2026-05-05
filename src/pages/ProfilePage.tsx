import { Page } from "../components/Page";
import { useApp } from "../store/AppContext";

export function ProfilePage() {
  const { carriedCount, allCharacters } = useApp();
  const friendCount = allCharacters.filter((c) => c.friend_status === "friend").length;
  const pendingCount = allCharacters.filter((c) => c.friend_status === "pending").length;

  return (
    <Page title="我的">
      <section className="rounded-xl border border-black/[0.08] bg-white p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-[#1A1611] text-xl font-black text-white">
            我
          </div>
          <div>
            <h2 className="text-xl font-black">观众信使</h2>
            <p className="text-sm text-[#766D62]">替跨剧角色保存那些不能直接抵达的话</p>
          </div>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <section className="rounded-xl border border-black/[0.08] bg-white p-4">
          <p className="text-xs font-semibold text-[#766D62]">我的角色</p>
          <p className="mt-2 text-3xl font-black">{friendCount}</p>
        </section>
        <section className="rounded-xl border border-black/[0.08] bg-white p-4">
          <p className="text-xs font-semibold text-[#766D62]">带出的信</p>
          <p className="mt-2 text-3xl font-black text-[#4A7A8A]">{carriedCount}</p>
        </section>
      </div>

      {pendingCount > 0 && (
        <section className="mt-4 rounded-xl border border-black/[0.08] bg-white p-4">
          <p className="text-xs font-semibold text-[#766D62]">申请中</p>
          <p className="mt-2 text-3xl font-black text-[#C4643A]">{pendingCount}</p>
          <p className="mt-1 text-xs text-[#9B9087]">等待角色回应</p>
        </section>
      )}

      <section className="mt-4 rounded-xl border border-black/[0.08] bg-white p-4">
        <p className="mb-3 text-xs font-semibold text-[#766D62]">观众的角色</p>
        <p className="font-serif text-sm leading-7 text-[#554B42]">
          你是生者与逝者之间唯一的桥梁。
          <br />
          你可以同时与两个空间的角色建立联系，
          <br />
          但他们彼此之间，无法直接交流。
        </p>
      </section>
    </Page>
  );
}
