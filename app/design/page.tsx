import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DesignShowcase from "./DesignShowcase";

export const metadata: Metadata = { title: "Design system" };

export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DesignShowcase />;
}