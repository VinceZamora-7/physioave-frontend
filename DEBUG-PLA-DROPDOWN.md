# Debugging Plan

**Problem:** Patient form dropdowns (region/province/city/baranggay) show "no available options".

## Checklist
- [x] Frontend dropdown logic is correct (cascading, fetches via TanStack Query)
- [x] No errors in PatientForm.vue or service files
- [x] PhilippineLocationTanstackService and PhilippineLocationService are implemented
- [x] Axios base URL for PLA API is set from .env.development
- [x] .env.development PLA API points to 127.0.0.1:8035
- [x] Backend PLA API is expected at /api/v2/pla
- [ ] Confirm PLA API is running and accessible
- [ ] Confirm PLA API endpoints return region/province/city/baranggay data
- [ ] Confirm frontend is not blocked by CORS or network errors

## Next Steps
1. Test PLA API endpoint (e.g. GET http://127.0.0.1:8035/api/v2/pla/regions) from frontend machine.
2. Check network tab in browser for failed requests or empty responses.
3. If API is not running, start PLA backend.
4. If API returns empty, check PLA database seed/data.
5. If CORS/network error, update backend CORS config.

---

**Action:** Test PLA API endpoint and check for network errors.
