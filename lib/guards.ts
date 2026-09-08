import { redirect } from "next/navigation";
import { hasModule } from "./modules";
import type { ModuleId, StoreData } from "./types";

export function requireModule(store: StoreData, id: ModuleId) {
  if (!hasModule(store.modules, id)) redirect("/home");
}
