/**
 * Utility functions for family user features
 */

/**
 * Check if family user has institution_id (either in profile or via resident links)
 * Note: This is a client-side check. The actual check should be done via API
 * to verify if user has active resident links with institutions.
 */
export const hasInstitutionAccess = (profile: any): boolean => {
  if (!profile) return false

  // Check if institution_id exists in profile
  // For family users, institution_id may be null initially
  // but they can still have access via resident links
  // We'll show menu items if institution_id exists OR if we can't determine
  // The actual validation will happen on API calls
  return !!profile.institution_id
}

/**
 * Get institution_id from profile
 */
export const getInstitutionId = (profile: any): string | null => {
  if (!profile) return null
  return profile.institution_id || null
}

/**
 * Check if user has any active resident links (async - requires API call)
 * This is a more accurate check but requires API call
 */
export const checkInstitutionAccessViaAPI = async (): Promise<boolean> => {
  try {
    // Try to fetch residents - if successful and has data, user has institution access
    const { getResidentsByFamily } = await import('@/apis/resident.api')
    const response = await getResidentsByFamily()
    const residents = response.data || []

    // Check if any resident has institution_id
    return residents.some((resident: any) => resident.institution_id)
  } catch (error) {
    // If API fails, assume no access
    return false
  }
}

