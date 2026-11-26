import type { Dispatch, SetStateAction } from "react";
import { TabsContent } from "@/components/ui/tabs";
import { CardFrame, CardFrameHeader, CardFramePanel, CardFrameTitle } from "@/components/ui/card-frame";
import { formatCurrency } from "@/lib/format";
import { FieldGrid } from "./editor-controls";
import { editorFieldValues } from "./editor-form";
import { offerFields } from "./editor-fields";

export function EditorOffer({
  compensation,
  setCompensation,
  errors,
}: {
  compensation: Record<string, string>;
  setCompensation: Dispatch<SetStateAction<Record<string, string>>>;
  errors?: Record<string, string>;
}) {
  const liveOfferTotal = (Number(compensation.base) || 0) + (Number(compensation.bonus) || 0) + (Number(compensation.equity) || 0);
  return (
            <TabsContent id="offer" className="flex flex-col gap-5">
              {compensation.currency?.trim() && liveOfferTotal > 0 && (
                <CardFrame>
                  <CardFrameHeader>
                    <CardFrameTitle>
                      Package Preview (
                      {compensation.currency.trim().toUpperCase()})
                    </CardFrameTitle>
                  </CardFrameHeader>
                  <CardFramePanel className="flex items-baseline justify-between p-4">
                    <span className="text-xs text-muted-foreground">
                      Total recorded compensation
                    </span>
                    <span className="text-2xl font-semibold tracking-tight tabular-nums">
                      {formatCurrency(
                        liveOfferTotal,
                        compensation.currency.trim(),
                      )}
                    </span>
                  </CardFramePanel>
                </CardFrame>
              )}

              <CardFrame>
                <CardFrameHeader>
                  <CardFrameTitle>
                    Offer &amp; Compensation Package
                  </CardFrameTitle>
                </CardFrameHeader>
                <CardFramePanel className="p-4">
                  <FieldGrid
                    fields={offerFields}
                    values={compensation}
                    errors={errors}
                    change={(key, value, html) =>
                      setCompensation((previous) => ({
                        ...previous,
                        ...editorFieldValues(key, value, html),
                      }))
                    }
                    idPrefix="offer"
                  />
                </CardFramePanel>
              </CardFrame>
            </TabsContent>

  );
}
