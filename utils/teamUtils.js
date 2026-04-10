// utils/teamUtils.js

export function normalizeTeamId(id) {
  if (id === null || id === undefined) return null
  return String(id)
}

export function resolveTeamId(team) {
  if (!team) return null

  // String → already ID
  if (typeof team === "string") return normalizeTeamId(team)

  // Number → convert
  if (typeof team === "number") return normalizeTeamId(team)

  // Object → extract id
  if (typeof team === "object") {
    return normalizeTeamId(team.id)
  }

  return null
}

export function normalizeTeamObject(team) {
  if (!team) return team

  return {
    ...team,
    id: normalizeTeamId(team.id)
  }
}
