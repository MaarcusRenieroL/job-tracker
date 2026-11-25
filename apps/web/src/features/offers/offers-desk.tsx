import { CompanyAvatar, StageBadge } from "@/components/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardFrame,
  CardFrameHeader,
  CardFramePanel,
  CardFrameTitle,
} from "@/components/ui/card-frame";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { formatCurrency, formatRelativeDays } from "@/lib/format";
import { Award, CalendarClock } from "lucide-react";
import { type OfferRow } from "../../types/application";

export function OffersDesk({
  offers,
  onSelectOffer,
}: {
  offers: OfferRow[];
  onSelectOffer: (applicationId: string) => void;
}) {
  if (offers.length === 0) {
    return (
      <CardFrame>
        <CardFramePanel>
          <Empty className="py-14">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Award />
              </EmptyMedia>
              <EmptyTitle>No compensation offers recorded yet</EmptyTitle>
              <EmptyDescription>
                Open any application and fill out the Offer tab (base, bonus,
                equity, ISO currency, and decision deadline) to compare packages
                side by side.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardFramePanel>
      </CardFrame>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {offers.map((row) => {
        const base = row.offer.base ?? 0;
        const bonus = row.offer.bonus ?? 0;
        const equity = row.offer.equity ?? 0;
        const total = base + bonus + equity;
        const basePct = total > 0 ? Math.round((base / total) * 100) : 0;
        const bonusPct = total > 0 ? Math.round((bonus / total) * 100) : 0;
        const equityPct = Math.max(0, 100 - basePct - bonusPct);

        return (
          <CardFrame key={row._id}>
            <CardFrameHeader>
              <CardFrameTitle>
                <CompanyAvatar company={row.company} size="sm" />
                <span className="truncate">
                  {row.company} · {row.role}
                </span>
              </CardFrameTitle>
              <StageBadge stage={row.stage} />
            </CardFrameHeader>
            <CardFramePanel className="flex flex-col gap-4 p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">
                    Total annual / grant package ({row.offer.currency})
                  </div>
                  <div className="mt-0.5 text-3xl font-semibold tracking-tight tabular-nums">
                    {formatCurrency(total, row.offer.currency)}
                  </div>
                </div>
                {row.offer.deadline && (
                  <Badge
                    variant="outline"
                    className="gap-1.5 rounded-md px-2 py-0.5 text-xs tabular-nums"
                  >
                    <CalendarClock className="size-3" />
                    Decision {row.offer.deadline} (
                    {formatRelativeDays(row.offer.deadline)})
                  </Badge>
                )}
              </div>

              {total > 0 && (
                <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
                  {basePct > 0 && (
                    <div
                      className="bg-primary"
                      style={{ width: `${basePct}%` }}
                      title={`Base: ${basePct}%`}
                    />
                  )}
                  {bonusPct > 0 && (
                    <div
                      className="bg-blue-500"
                      style={{ width: `${bonusPct}%` }}
                      title={`Bonus: ${bonusPct}%`}
                    />
                  )}
                  {equityPct > 0 && (
                    <div
                      className="bg-emerald-500"
                      style={{ width: `${equityPct}%` }}
                      title={`Equity: ${equityPct}%`}
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/80 bg-muted/35">
                <div className="p-3">
                  <div className="text-xs text-muted-foreground">Base</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums">
                    {formatCurrency(row.offer.base, row.offer.currency)}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs text-muted-foreground">Bonus</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums">
                    {formatCurrency(row.offer.bonus, row.offer.currency)}
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-xs text-muted-foreground">Equity</div>
                  <div className="mt-0.5 text-sm font-semibold tabular-nums">
                    {formatCurrency(row.offer.equity, row.offer.currency)}
                  </div>
                </div>
              </div>

              {row.offer.notes && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {row.offer.notes}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  variant="outline"
                  size="xs"
                  onPress={() => onSelectOffer(row._id)}
                >
                  Edit offer &amp; details
                </Button>
              </div>
            </CardFramePanel>
          </CardFrame>
        );
      })}
    </div>
  );
}
