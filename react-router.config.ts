// react-router.config.ts //
import type { Config } from "@react-router/dev/config";

export default {
	ssr: true,
	future: {
		unstable_viteEnvironmentApi: true,
	},
} satisfies Config;
