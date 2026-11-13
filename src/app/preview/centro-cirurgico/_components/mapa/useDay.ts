"use client"

import { useMemo } from "react"

import { useUnitData } from "../../_data/store"
import { roomsOn, surgeriesOn } from "./schedule"

/**
 * Salas (com o bloqueio do dia) e cirurgias do dia `day` na unidade
 * escolhida, mais a fila
 * "A alocar". Tudo o que o mapa e os modais calculam parte daqui.
 */
export const useDay = (day: string) => {
  const { rooms: allRooms, surgeries: allSurgeries } = useUnitData()
  const rooms = useMemo(() => roomsOn(allRooms, day), [allRooms, day])
  const surgeries = useMemo(
    () => surgeriesOn(allSurgeries, day),
    [allSurgeries, day],
  )
  return { rooms, surgeries }
}
