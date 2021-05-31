import clsx from "clsx";
import Link from "next/link";
import { useRouter } from "next/router";
import { getSiteMetaData } from "@utils/helpers";

export function Layout({ children }) {
  const { author } = getSiteMetaData();

  return (
    <div className="w-full min-h-screen bg-gray-900 text-white">
      <div className="max-w-screen-sm px-4 py-12 mx-auto antialiased font-body">
        <Header />
        <main>{children}</main>
        <footer className="text-lg font-normal">
          © {new Date().getFullYear()}{" "}
          <a href={author.homepage}>{author.name}</a>, Built with &#10084; and{" "}
          <a href="https://nextjs.org/">Next.js</a>
        </footer>
      </div>
    </div>
  );
}

const Header = () => {
  const { pathname } = useRouter();
  const isRoot = pathname === "/";

  return (
    <header
      className={clsx("flex items-center justify-between ", {
        "mb-8": isRoot,
        "mb-2": !isRoot,
      })}
    >
      <div className={"max-w-md"}>
        {isRoot ? <LargeTitle /> : <SmallTitle />}
      </div>
    </header>
  );
};

const LargeTitle = () => (
  <h1>
    <Link href="/">
      <a
        className={clsx(
          "text-3xl font-extrabold leading-none no-underline font-display",
          "sm:text-5xl",
          "text-white"
        )}
      >
        Cloud Gardener
      </a>
    </Link>
  </h1>
);

const SmallTitle = () => (
  <h1>
    <Link href="/">
      <a
        className={clsx(
          "text-2xl font-extrabold no-underline font-display",
          "text-white"
        )}
      >
        Cloud Gardener
      </a>
    </Link>
  </h1>
);
