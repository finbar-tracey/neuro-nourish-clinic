"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";

type DocItem = {
  id: string;
  docKey: string;
  label: string;
  required: boolean;
  status: string;
};

type UploadPageData = {
  borrowerName: string;
  documents: DocItem[];
};

export function BorrowerUploadPage({ token }: { token: string }) {
  const [data, setData] = useState<UploadPageData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/upload/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error("Invalid link");
        return r.json();
      })
      .then(setData)
      .catch(() => setError("This upload link is invalid or has expired."));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(docKey: string, file: File) {
    setUploading(docKey);
    setUploadError(null);
    try {
      const form = new FormData();
      form.append("docKey", docKey);
      form.append("file", file);
      const res = await fetch(`/api/upload/${token}`, { method: "POST", body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setUploadError(body.error ?? "Upload failed — try a PDF, Word doc, or image under 10 MB");
        return;
      }
      load();
    } catch {
      setUploadError("Upload failed — check your connection and try again");
    } finally {
      setUploading(null);
    }
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <p className="text-center text-slate-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-ink">
            Bridging Loans Broker
          </p>
          <h1 className="mt-2 text-2xl font-bold text-navy">Upload your documents</h1>
          <p className="mt-2 text-sm text-slate-600">
            Hi {data.borrowerName}, please upload the documents Daniel needs to review your
            bridging finance enquiry. Subject to status and lender criteria.
          </p>
        </div>

        {uploadError && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {uploadError}
          </p>
        )}

        <ul className="space-y-4">
          {data.documents.map((doc) => (
            <li
              key={doc.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-navy">{doc.label}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {doc.status === "UPLOADED" || doc.status === "ACCEPTED" ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle className="h-3 w-3" /> Uploaded
                      </span>
                    ) : doc.status === "NEEDS_REPLACEMENT" ? (
                      "Needs replacement"
                    ) : (
                      "Required"
                    )}
                  </p>
                </div>
                {doc.status !== "UPLOADED" && doc.status !== "ACCEPTED" && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void upload(doc.docKey, file);
                      }}
                    />
                    <span className="inline-flex rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-navy">
                      {uploading === doc.docKey ? "Uploading…" : "Upload"}
                    </span>
                  </label>
                )}
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-center text-xs text-slate-400">
          Your documents are stored securely. Questions? Call 020 7177 4141.
        </p>
      </div>
    </div>
  );
}
