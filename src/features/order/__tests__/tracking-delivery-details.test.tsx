// @vitest-environment jsdom
/**
 * The tracking page shows every shipment of an order bought from several
 * stores — not only the first — and a delivery time slot only when the
 * backend gives one (the « Entre 10h et 14h » it showed was invented).
 */
import { describe, expect, it } from "vitest";
import { render, screen, within } from "@/test/render";
import { DeliveryDetails } from "../components/DeliveryDetails";
import { EstimatedDeliveryCard } from "../components/EstimatedDeliveryCard";
import type { TrackedShipment } from "../models/order";

const SHIPMENT: TrackedShipment = {
  id: "01jkqz3m5baxnp9c7hd2fews01",
  storeName: "Boutique Awa",
  agencyName: "Livo",
  agencyRating: 4.5,
  shippingMethod: "Standard",
  driver: { name: "Issa", phone: "+22670000000" },
  estimatedDate: "22 octobre 2026",
  estimatedTimeRange: null,
};

const details = (shipments: TrackedShipment[]) => (
  <DeliveryDetails
    agencyName="Livo"
    agencyRating={4.5}
    shippingMethod="Standard"
    deliveryAddress="Ouagadougou, Burkina Faso"
    driver={SHIPMENT.driver}
    shipments={shipments}
  />
);

describe("DeliveryDetails", () => {
  it("shows each shipment of an order that travels in several", () => {
    render(
      details([
        SHIPMENT,
        { ...SHIPMENT, id: "01jkqz3m5baxnp9c7hd2fews02", storeName: "Marché Kalam", agencyName: "Yobi", driver: null },
      ]),
    );

    const first = screen.getByRole("region", { name: "Livraison 1 sur 2" });
    const second = screen.getByRole("region", { name: "Livraison 2 sur 2" });
    expect(within(first).getByText(/Boutique Awa/)).toBeInTheDocument();
    expect(within(first).getByText("Issa")).toBeInTheDocument();
    expect(within(second).getByText(/Marché Kalam/)).toBeInTheDocument();
    expect(within(second).getByText("Yobi")).toBeInTheDocument();
    expect(within(second).queryByText("Issa")).toBeNull();
    expect(screen.getAllByText("Ouagadougou, Burkina Faso")).toHaveLength(1);
  });

  it("keeps the single delivery block for an order in one shipment", () => {
    render(details([SHIPMENT]));

    expect(screen.queryByRole("region", { name: /Livraison 1 sur/ })).toBeNull();
    expect(screen.getByText("Issa")).toBeInTheDocument();
  });
});

describe("EstimatedDeliveryCard", () => {
  it("shows no time slot when the backend gives none", () => {
    render(<EstimatedDeliveryCard estimatedDate="22 octobre 2026" timeRange={null} progress={50} />);

    expect(screen.getByText("22 octobre 2026")).toBeInTheDocument();
    expect(screen.queryByText(/Entre/)).toBeNull();
    expect(screen.queryByText("—")).toBeNull();
  });

  it("shows the slot the backend gives", () => {
    render(<EstimatedDeliveryCard estimatedDate="22 octobre 2026" timeRange="Entre 8h et 12h" progress={50} />);

    expect(screen.getByText("Entre 8h et 12h")).toBeInTheDocument();
  });
});
