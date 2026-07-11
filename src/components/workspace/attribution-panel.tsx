"use client";

import {
  channelBadgeClass,
  formatSourceLabel,
  hasAttributionData,
  landingPath,
  parseAdAngle,
  truncateId,
  type LeadAttributionFields,
} from "@/lib/attribution-display";

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-navy break-all">{value}</dd>
    </div>
  );
}

type Props = {
  lead: LeadAttributionFields;
  className?: string;
};

export function AttributionPanel({ lead, className }: Props) {
  if (!hasAttributionData(lead)) return null;

  const adAngle = parseAdAngle(lead.additionalInfo);
  const path = landingPath(lead.landingPageUrl);

  return (
    <div className={className}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Source & tracking
        </p>
        {lead.attributionChannel && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${channelBadgeClass(lead.attributionChannel)}`}
          >
            {lead.attributionChannel}
          </span>
        )}
      </div>
      <dl className="grid gap-3 sm:grid-cols-2 text-sm">
        <Detail label="Form source" value={formatSourceLabel(lead.source)} />
        {adAngle && <Detail label="Ad angle" value={adAngle.toUpperCase()} />}
        {lead.utmSource && <Detail label="UTM source" value={lead.utmSource} />}
        {lead.utmMedium && <Detail label="UTM medium" value={lead.utmMedium} />}
        {lead.utmCampaign && <Detail label="UTM campaign" value={lead.utmCampaign} />}
        {lead.utmContent && <Detail label="UTM content" value={lead.utmContent} />}
        {lead.utmTerm && <Detail label="UTM term" value={lead.utmTerm} />}
        {path && <Detail label="Landing page" value={path} />}
        {lead.deviceType && <Detail label="Device" value={lead.deviceType} />}
        {lead.fbclid && (
          <Detail label="Facebook click ID" value={truncateId(lead.fbclid)} />
        )}
        {lead.gclid && <Detail label="Google click ID" value={truncateId(lead.gclid)} />}
        {lead.referrer && (
          <Detail
            label="Referrer"
            value={lead.referrer.length > 60 ? `${lead.referrer.slice(0, 60)}…` : lead.referrer}
          />
        )}
      </dl>
    </div>
  );
}
