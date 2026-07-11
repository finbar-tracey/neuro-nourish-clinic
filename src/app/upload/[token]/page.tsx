import { BorrowerUploadPage } from "@/components/upload/borrower-upload";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <BorrowerUploadPage token={token} />;
}
