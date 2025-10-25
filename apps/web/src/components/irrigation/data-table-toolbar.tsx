"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        {/* Filtro de observações (fuzzy search) */}
        <Input
          placeholder="Buscar observações..."
          value={
            (table.getColumn("notes")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("notes")?.setFilterValue(event.target.value)
          }
          className="h-9 w-[200px]"
        />

        {/* Filtro de tipo */}
        <Select
          value={
            (table.getColumn("type")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("type")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Tipo de irrigação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="automatic">Automático</SelectItem>
            <SelectItem value="rain">Chuva</SelectItem>
            <SelectItem value="detected">Detectado</SelectItem>
          </SelectContent>
        </Select>

        {/* Filtro de status */}
        <Select
          value={
            (table.getColumn("status")?.getFilterValue() as string) ?? "all"
          }
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "all" ? "" : value)
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pendente">Pendente</SelectItem>
            <SelectItem value="confirmado">Confirmado</SelectItem>
          </SelectContent>
        </Select>

        {/* Botão para limpar filtros */}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3"
          >
            Limpar
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
