import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Check,
  Minus,
  Plus,
  ShoppingCart,
  SquareArrowOutUpRight,
  X,
} from "lucide-react";
import { useEventStore } from "@/stores/eventStore";
import { Label } from "./ui/label";
import { Confetti, type ConfettiRef } from "@/components/ui/confetti";
import { useTicketStore } from "@/stores/ticketStore";
import {
  Controller,
  useForm,
  type SubmitHandler,
  useWatch,
} from "react-hook-form";
import { toastError, toastSuccess } from "@/utils/toastWrapper";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

interface PurchaseTicketProps {
  open: boolean;
  onClose: () => void;
}

interface PurchaseFormData {
  quantity: number;
}

const PurchaseTicket = ({ open, onClose }: PurchaseTicketProps) => {
  const { currentEvent, fetchEvent } = useEventStore();
  const { purchaseTickets } = useTicketStore();

  const confettiRef = useRef<ConfettiRef>(null);
  const { handleSubmit, control } = useForm<PurchaseFormData>({
    defaultValues: {
      quantity: 1,
    },
  });
  const watchedQuantity = useWatch({ control, name: "quantity" });

  const [verifiedOrderCount, setVerifiedOrderCount] = useState<number>(0);

  useEffect(() => {
    if (open) {
      setVerifiedOrderCount(0);
    }
  }, [open]);

  useEffect(() => {
    if (open && verifiedOrderCount > 0) {
      confettiRef.current?.fire();
    }
  }, [verifiedOrderCount]);

  const onSubmit: SubmitHandler<PurchaseFormData> = async (data) => {
    if (!currentEvent) return;

    const result = await purchaseTickets(currentEvent.id, data.quantity);
    if ("error" in result) {
      toastError(result.error.message);
      return;
    } else {
      toastSuccess(result.message);
      setVerifiedOrderCount(result.count);
    }
  };

  const handleClose = () => {
    onClose();
    if (verifiedOrderCount > 0 && currentEvent) {
      fetchEvent(currentEvent.id);
    }
  };

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[771] grid place-items-start opacity-0 transition-opacity sm:place-items-center",
        open && "pointer-events-auto opacity-100",
      )}
    >
      <div
        className="z-[769] hidden size-full bg-black/50 [grid-area:1/1] sm:block"
        onClick={handleClose}
      />

      <div
        className={cn(
          "bg-background z-[771] mt-[calc(4rem+1px)] flex size-full max-h-[90vh] w-full flex-col overflow-scroll transition-transform duration-250 [grid-area:1/1] sm:m-4 sm:h-fit sm:max-w-xl sm:rounded-xl sm:border lg:max-w-2xl",
          open ? "scale-100" : "scale-80",
        )}
      >
        <div className="bg-background sticky top-0 z-10 flex items-center justify-between p-4 sm:p-6">
          <h2 className="text-2xl sm:text-3xl">
            {verifiedOrderCount > 0 ? "Payment Successful" : "Order Summary"}
          </h2>
          <Button
            size="icon"
            className="size-10"
            variant="ghost"
            onClick={handleClose}
          >
            <X className="size-5" />
          </Button>
        </div>
        {verifiedOrderCount === 0 ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-8 p-4 sm:p-6 sm:pt-2"
          >
            <div className="grid grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm sm:text-base">Event</p>
                <p className="col-span-3 font-semibold sm:text-xl">
                  {watchedQuantity}x {currentEvent?.title}
                </p>
              </div>
              <div>
                <p className="text-right text-sm sm:text-base">Price</p>
                <p className="col-span-3 font-semibold sm:text-xl">
                  $
                  {(
                    Number(currentEvent?.ticket_price) * watchedQuantity
                  ).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-end gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Controller
                  control={control}
                  name="quantity"
                  render={({ field }) => (
                    <div className="flex h-10 w-fit items-center gap-2 rounded-full border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-[38px]"
                        disabled={field.value === 1}
                        onClick={() =>
                          field.onChange(Math.max(1, field.value - 1))
                        }
                      >
                        <Minus />
                      </Button>
                      <p className="grid w-6 place-items-center select-none">
                        {field.value}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-[38px]"
                        disabled={field.value === 5}
                        onClick={() =>
                          field.onChange(Math.min(5, field.value + 1))
                        }
                      >
                        <Plus />
                      </Button>
                    </div>
                  )}
                />
              </div>
              <Button size="lg" className="w-fit" type="submit">
                <ShoppingCart />
                Purchase
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-8 p-4 sm:p-6 sm:pt-2">
            <div className="grid grid-cols-[1fr_auto]">
              <div>
                <p className="text-sm sm:text-base">Event</p>
                <p className="col-span-3 font-semibold sm:text-xl">
                  {verifiedOrderCount}x {currentEvent?.title}
                </p>
              </div>
              <div>
                <p className="text-right text-sm sm:text-base">Price</p>
                <p className="col-span-3 font-semibold sm:text-xl">
                  $
                  {(
                    Number(currentEvent?.ticket_price) * verifiedOrderCount
                  ).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                className="w-fit"
                type="button"
                onClick={handleClose}
              >
                <Check />
                Done
              </Button>
              <Link to={`/my-tickets`}>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-fit"
                  type="button"
                >
                  <SquareArrowOutUpRight />
                  View Tickets
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      <Confetti
        ref={confettiRef}
        manualstart
        options={{ spread: 90, particleCount: 100, ticks: 500 }}
        className="pointer-events-none absolute inset-0 z-[770] size-full"
      />
    </div>
  );
};

export default PurchaseTicket;
