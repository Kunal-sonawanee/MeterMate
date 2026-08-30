"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Pencil, Plus, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  EmptyState,
  ErrorState,
  LoadingRegion,
  Skeleton,
} from "@/components/ui/states";
import { PropertyDialog } from "@/components/properties/property-dialog";
import { MeterDialog } from "@/components/meters/meter-dialog";
import { ApiRequestError } from "@/lib/api";
import {
  errorMessage,
  useDeleteProperty,
  useProperties,
} from "@/hooks/use-metermate";
import type { PropertySummary } from "@/lib/types";

/**
 * Properties are the top of the hierarchy: a property holds meters, and meters
 * hold readings. Deleting one takes everything below it with it, so that
 * confirmation asks twice — once for the property, and again once the server
 * reports how many meters would go with it.
 */
export function PropertiesScreen() {
  const {
    data: properties,
    isPending,
    isError,
    error,
    refetch,
  } = useProperties();
  const [editing, setEditing] = useState<PropertySummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PropertySummary | null>(
    null,
  );
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [cascadeConfirmed, setCascadeConfirmed] = useState(false);
  const deleteProperty = useDeleteProperty();

  function startDelete(property: PropertySummary) {
    setDeleteError(null);
    setCascadeConfirmed(false);
    setPendingDelete(property);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleteError(null);

    try {
      await deleteProperty.mutateAsync({
        id: pendingDelete.id,
        cascade: cascadeConfirmed,
      });
      setPendingDelete(null);
    } catch (caught) {
      // 409 means the property still has meters — the server's message spells
      // out what would be lost, and confirming again opts into the cascade.
      if (caught instanceof ApiRequestError && caught.status === 409) {
        setCascadeConfirmed(true);
        setDeleteError(caught.message);
        return;
      }
      setDeleteError(errorMessage(caught, "Couldn't delete that property."));
    }
  }

  return (
    <>
      <PageHeader
        title="Properties"
        description="Buildings and units you bill for. Meters live under a property."
        actions={
          <PropertyDialog
            trigger={
              <Button>
                <Plus aria-hidden />
                Add property
              </Button>
            }
          />
        }
      />

      {isPending ? (
        <LoadingRegion
          label="Loading properties"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <Card key={index}>
              <CardContent>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-2 h-3 w-32" />
                <Skeleton className="mt-4 h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </LoadingRegion>
      ) : isError ? (
        <ErrorState error={error} onRetry={() => refetch()} />
      ) : properties.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Start with the building or unit you bill for. You can add its meters next."
          action={
            <PropertyDialog
              trigger={<Button>Add your first property</Button>}
            />
          }
          className="bg-card"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <li key={property.id}>
              <Card interactive className="flex h-full flex-col">
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h2 className="truncate text-[0.9375rem] font-semibold">
                        {property.name}
                      </h2>
                      {property.address ? (
                        <p className="text-muted-foreground mt-1 flex items-start gap-1.5 text-sm">
                          <MapPin
                            aria-hidden
                            className="mt-0.5 size-3.5 shrink-0"
                          />
                          <span className="line-clamp-2">
                            {property.address}
                          </span>
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(property)}
                      >
                        <Pencil aria-hidden />
                        <span className="sr-only">Edit {property.name}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="hover:bg-destructive-soft hover:text-destructive focus-visible:text-destructive focus-visible:outline-destructive"
                        onClick={() => startDelete(property)}
                      >
                        <Trash2 aria-hidden />
                        <span className="sr-only">Delete {property.name}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <Badge tone={property.meterCount > 0 ? "brand" : "outline"}>
                      {property.meterCount} meter
                      {property.meterCount === 1 ? "" : "s"}
                    </Badge>
                  </div>

                  <div className="mt-auto flex items-center gap-2 pt-4">
                    <MeterDialog
                      defaultPropertyId={property.id}
                      trigger={
                        <Button variant="outline" size="sm" className="flex-1">
                          <Plus aria-hidden />
                          Add meter
                        </Button>
                      }
                    />
                    {property.meterCount > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href="/meters" />}
                      >
                        View meters
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <PropertyDialog
        property={editing ?? undefined}
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        destructive
        title={`Delete ${pendingDelete?.name ?? "this property"}?`}
        description={
          cascadeConfirmed
            ? "Confirming again will delete the property, its meters and every reading recorded against them."
            : "This can't be undone."
        }
        confirmLabel={
          cascadeConfirmed ? "Delete everything" : "Delete property"
        }
        pending={deleteProperty.isPending}
        error={deleteError}
        onConfirm={confirmDelete}
      />
    </>
  );
}
