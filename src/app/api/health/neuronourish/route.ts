import { NextResponse } from "next/server";
import { checkNeuronourishGoLiveHealth } from "@/lib/neuronourish-go-live-health";

/** Read-only NeuroNourish go-live gate — verifies vertical + integrations. */
export async function GET() {
  const health = checkNeuronourishGoLiveHealth();
  const httpStatus = health.status === "unhealthy" ? 503 : 200;
  return NextResponse.json(health, { status: httpStatus });
}
