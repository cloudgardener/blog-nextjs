import clsx from "clsx";

import { Image } from "..";
import { getSiteMetaData } from "@utils/helpers";

export function Bio({ className }) {
  const { author, social } = getSiteMetaData();

  return (
    <div className={clsx(`flex items-center`, className)}>
      <Image
        className="flex-shrink-0 mb-0 mr-3 rounded-full w-20 h-20"
        src={require("../../../content/assets/profile.png")}
        webpSrc={require("../../../content/assets/profile.png?webp")}
        previewSrc={require("../../../content/assets/profile.png?lqip")}
        alt="Profile"
      />

      <p className="text-base leading-7">
        <b className="font-semibold">{author.name}</b> {author.summary}{" "}
        <a href={`https://twitter.com/${social.twitter}`}>
          Follow him on Twitter
        </a>
      </p>
    </div>
  );
}
