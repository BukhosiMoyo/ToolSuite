Merge PDF — TODOs

Priority: High

1) Frontend: Pre-check PDFs with pdf.js and block encrypted/corrupt files
2) Frontend: Add Cancel button to abort active merge upload
3) Frontend: Handle 404/413/415/422/429/500 with friendly inline banners
4) Frontend: Enforce max files and total size before enabling Merge
5) Frontend: Estimate total pages and warn/block above threshold
6) Frontend: Detect duplicate files and prompt to remove
7) Frontend: Show offline banner and disable Merge when offline
8) Frontend: Add .env.local template and README note for VITE_API_BASE

Priority: Medium

9) Backend: Enforce max file count with 422 too_many_files
10) Backend: Enforce max total input bytes with 413 payload_too_large
11) Backend: Enforce max total pages with 422 too_many_pages
12) Backend: Add merge processing timeout watchdog with 422 merge_timeout
13) Backend: Standardize error codes/messages across merge cases
14) Backend: Add structured logging including filenames on failures
15) QA: Add curl scripts/tests for success and all error scenarios

Notes
- Local dev API: http://127.0.0.1:4000 (VITE_API_BASE)
- Field name: files[] (backend also accepts files)
- Encrypted/corrupt PDFs now return 422 invalid_or_encrypted_pdf



