import type { FC } from "hono/jsx";

const Layout: FC = (props) => {
  return (
    <html>
      <meta>
        <title key="title">Deprecated golink landing page</title>
      </meta>
      <body>{props.children}</body>
    </html>
  );
};

export const DeprecatedGoLinkPage: FC<{
  url: string;
  golink: string;
  reason: string | "We're changing things up";
}> = (props: { golink: string; reason: string | null }) => {
  const forceRedirect = `/${props.golink}?force_redirect=1`;
  return (
    <Layout>
      <h1>Deprecated golink: go/{props.golink}</h1>
      This golink is being flagged as deprecated due to the following reason:
      <ul>
        <li>{props.reason || "No reason provided yet"}</li>
      </ul>
      <p>
        If the golink is being renamed as the reason, please update your URLs. If you still want to go there, please{" "}
        <a href={forceRedirect}>click here</a>.
      </p>
      <hr />
      <p>The lack of CSS is intentional to keep things simple. It will be added soon.</p>
    </Layout>
  );
};
