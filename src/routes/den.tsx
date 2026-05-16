import { createFileRoute } from "@tanstack/react-router";
import { DenPage } from "@/components/den/DenPage";

export const Route = createFileRoute("/den")({
  component: DenPage,
  head: () => ({
    meta: [{ title: "The Den · HIVE" }],
  }),
});
