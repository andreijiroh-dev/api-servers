import { css, Style } from "hono/css"
import type { FC, PropsWithChildren } from "hono/jsx"

const styling = css`
body {
	max-width: 800px;
	margin: 0 auto;
	font: 11pt monospace;
	padding: 0 1rem;
}

ul li {
	margin: 0.5rem 0;
}

.muted {
	color: grey;
}

pre {
	max-width: 100%;
	overflow-x: auto;
	background: #e0e0e0;
	margin: 0 -1rem;
	padding: 0 1rem;
}

pre+pre {
	margin-top: 1rem;
}

h2 a {
	text-decoration: none;
	color: black;
}

.breakdown {
	display: flex;
	justify-content: space-between;
}

@media(max-width: 720px) {
	.breakdown {
		display: block;
	}

	.breakdown span {
		display: block;
	}
}

.breakdown span {
	padding: 0.5rem;
}
`

type PageMetadata = {
	title: string
	name: string
}

export const BaseLayout: FC = (props) => {
	return(
		<html>
			<head>
			    <title key="title">{props.title} - Andrei Jiroh's golinks service</title>
				<Style>{styling}</Style>
			</head>
			<body>
				{props.children}
			</body>
		</html>
	)
}
