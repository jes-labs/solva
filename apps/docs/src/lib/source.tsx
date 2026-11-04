import { docs } from "collections/server";
import { loader } from "fumadocs-core/source";
import { statusBadgesPlugin } from "fumadocs-core/source/status-badges";

export const source = loader({
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  plugins: [
    statusBadgesPlugin({
      renderBadge: () => <span className="coming-soon">Soon</span>,
    }),
  ],
});
