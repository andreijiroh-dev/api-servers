import { css, Style } from "hono/css";
import type { FC } from "hono/jsx";
import { BaseLayout } from "./base";

export const DeprecatedGoLinkPage: FC<{
  golink: string;
  reason: string | "We're changing things up";
}> = (props: { golink: string; reason: string | null }) => {
  const forceRedirect = `/${props.golink}?force_redirect=1`;
		return (
			<BaseLayout title="Deprecated golink">
				<h1>Deprecated golink: go/{props.golink}</h1>
				<p>This golink is being flagged as deprecated due to the following reason:</p>
				<ul>
					<li>{props.reason || "No reason provided yet"}</li>
				</ul>
				<p>
					If the golink is being renamed as the reason, please update your URLs. If you still want to go there, please{" "}
					<a href={forceRedirect}>click here</a>.
				</p>
				<hr />
				<p>The lack of CSS is intentional to keep things simple. It will be added soon.</p>
			</BaseLayout>
		)
};
