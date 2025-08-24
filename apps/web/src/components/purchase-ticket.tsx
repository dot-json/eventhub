import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Minus, Plus, ShoppingCart, X } from "lucide-react";
import { useEventStore } from "@/stores/eventStore";
import { useState } from "react";
import { Label } from "./ui/label";
import { ConfettiButton } from "./ui/confetti";

interface PurchaseTicketProps {
  open: boolean;
  onClose: () => void;
}

const PurchaseTicket = ({ open, onClose }: PurchaseTicketProps) => {
  const { currentEvent } = useEventStore();
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, Math.min(5, prev + delta)));
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[771] grid place-items-start opacity-0 transition-opacity sm:place-items-center",
        open && "pointer-events-auto opacity-100",
      )}
    >
      <div
        className="z-[771] hidden size-full bg-black/50 [grid-area:1/1] sm:block"
        onClick={onClose}
      />
      <div
        className={cn(
          "bg-background z-[771] mt-[calc(4rem+1px)] flex size-full max-h-[90vh] w-full flex-col overflow-scroll transition-transform duration-250 [grid-area:1/1] sm:m-4 sm:h-fit sm:max-w-xl sm:rounded-xl sm:border lg:max-w-2xl",
          open ? "scale-100" : "scale-80",
        )}
      >
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6">
          <h2 className="text-2xl sm:text-3xl">Order Summary</h2>
          <Button
            size="icon"
            className="size-10"
            variant="ghost"
            onClick={onClose}
          >
            <X className="size-5" />
          </Button>
        </div>
        <div className="flex flex-col gap-8 p-4 sm:p-6 sm:pt-2">
          <div className="grid grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm sm:text-base">Event</p>
              <p className="col-span-3 font-semibold sm:text-xl">
                {quantity}x {currentEvent?.title}
              </p>
            </div>
            <div>
              <p className="text-right text-sm sm:text-base">Price</p>
              <p className="col-span-3 font-semibold sm:text-xl">
                ${(Number(currentEvent?.ticket_price) * quantity).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-end gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <div className="flex h-10 w-fit items-center gap-2 rounded-full border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-[38px]"
                  disabled={quantity === 1}
                  onClick={() => handleQuantityChange(-1)}
                >
                  <Minus />
                </Button>
                <p className="grid w-6 place-items-center select-none">
                  {quantity}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-[38px]"
                  disabled={quantity === 5}
                  onClick={() => handleQuantityChange(1)}
                >
                  <Plus />
                </Button>
              </div>
            </div>
            <ConfettiButton
              options={{
                zIndex: 1001,
              }}
              size="lg"
              className="w-fit"
            >
              <ShoppingCart />
              Purchase
            </ConfettiButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTicket;
