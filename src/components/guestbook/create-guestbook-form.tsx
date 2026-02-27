"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createGuestbookAction } from "@/app/(dashboard)/guestbooks/new/actions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModalPunchHoles, getModalPunchHoleMask } from "@/components/ui/modal-punch-holes";
import { GuestbookIcon } from "@/components/guestbook/guestbook-icon";

export function CreateGuestbookForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await createGuestbookAction(name.trim());

    if (result.error) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Guestbook created!");
    router.push(`/guestbooks/${result.id}/inbox`);
  }

  return (
    <div className="relative w-full max-w-[459px] rounded-card shadow-card">
      <Card style={getModalPunchHoleMask()}>
        <div className="h-[64px]" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-[80px] p-[24px] pt-0">
          <div className="flex flex-col gap-[32px]">
            {/* Logo + Heading */}
            <div className="flex flex-col gap-[24px]">
              <div className="w-[80px] h-[60px]">
                <img src="/logo.svg" alt="Guestbook" className="w-full h-full" />
              </div>
              <h1 className="text-heading font-semibold leading-none text-text-primary">
                Create Guestbook
              </h1>
            </div>

            {/* Icon + Form fields */}
            <div className="flex flex-col gap-[24px]">
              <GuestbookIcon />

              <div className="flex flex-col gap-[16px]">
                <div className="flex flex-col gap-[8px]">
                  <h2 className="text-subheading font-semibold text-text-primary">
                    Guestbook name
                  </h2>
                  <p className="text-body font-medium text-text-secondary">
                    You can switch or add new guestbook from the top nav
                  </p>
                </div>

                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter guestbook name"
                />
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Get started"}
          </Button>
        </form>
      </Card>
      <ModalPunchHoles />
    </div>
  );
}
