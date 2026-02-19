import { redirect } from "next/navigation";

export default async function GuestbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/guestbooks/${id}/inbox`);
}
