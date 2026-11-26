# Reconstructed v4 design quality scorecard

Internal self-assessment, not independent customer research or a competitive ranking. Scores are conservative reviewer judgments supported by the rendered evidence and tests described below. The 95/100 aspiration is not achieved or claimed. Missing evidence is unscored rather than treated as a pass.

Weights: hierarchy H=12; typography T=10; brand B=10; photography/authenticity P=10; discovery D=15; mobile M=15; conversion C=10; accessibility A=8; performance F=5; credibility R=5.

| Public interface | H | T | B | P | D | M | C | A | F | R | Result |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Home | 10 | 8 | 8 | 3 | 10 | 12 | 6 | 7 | 3 | 3 | 80/100 |
| Catalogue | 10 | 8 | 8 | 2 | 11 | 12 | 6 | 7 | 3 | 3 | 80/100 |
| Property detail | 10 | 8 | 8 | 2 | 11 | 12 | 6 | 7 | NR | 3 | 77 points evidenced; performance unscored |
| Comparison | 10 | 8 | 8 | 2 | 11 | 12 | 6 | 7 | 4 | 3 | 81/100 |
| Map discovery | 10 | 8 | 8 | 2 | 11 | 12 | 6 | 7 | NR | 3 | 77 points evidenced; performance unscored |
| About | 10 | 8 | 8 | 8 | 9 | 12 | 6 | 6 | NR | 3 | 80 points evidenced; performance unscored |
| Sell | 10 | 8 | 8 | 6 | 9 | 12 | 6 | 6 | NR | 3 | 78 points evidenced; performance unscored |
| Contact | 10 | 8 | 8 | 6 | 9 | 12 | 6 | 6 | NR | 3 | 78 points evidenced; performance unscored |
| Resources | 10 | 8 | 8 | 9 | 10 | 12 | 6 | 6 | NR | 3 | 82 points evidenced; performance unscored |

NR has maximum five points; partial results are not normalised to a percentage or presented as final totals.

## Evidence and deductions

- Hierarchy: final-v4 full-page renders show one clear primary heading, consistent editorial subheads, visible next steps and purposeful content grouping. Some long pages still carry substantial whitespace and secondary content; two points withheld.
- Typography: official self-hosted Source Serif 4 normal 400, readable form/body text and shared tokens are directly inspectable. Manrope is unavailable and the full font-pair intent remains incomplete; two points withheld.
- Brand: the existing Hilltop CSS mark and navy/gold palette are consistent across routes. Original logo artwork cannot be authenticated; two points withheld.
- Photography/authenticity: homepage illustration is clearly labelled; fabricated staff/counts/estate claims and unrelated neighbourhood photos are removed. Listing images are fixtures only; genuine property photography and inventory remain absent, hence low listing-page scores. About/resources responsibly omit unsupported photography; Contact/Sell retain business details needing source confirmation.
- Discovery: URL-driven filters, sorting, vertical Ledger cards, optional map, category facts and related browsing are demonstrated by browser/unit tests and captures. Current production has no configured live catalogue, so maximum discovery scores are unsupported.
- Mobile: seven required widths have captured renders and geometry checks, plus narrow comparison/drawer/gallery/menu regressions. Real-device and participant usability testing is absent; three points withheld.
- Conversion: full mocked success/failure enquiry and viewing journeys pass; actual email/WhatsApp/viewing operations and live inventory are unverified. Six points recognise working interface paths, not proven customer conversion.
- Accessibility: 22 public axe checks, two real-map failure audits, two recommendations-failure audits, six available entry-state audits and eleven open-dialog audits and keyboard/focus regressions support substantial credit. Screen-reader/manual device acceptance is incomplete; public forms with less direct keyboard journey evidence receive six rather than seven points.
- Performance: VERIFICATION-V4.md and performance.json support only the three measured unconfigured production routes. All other routes remain unscored. Local lab evidence does not establish field experience or INP.
- Credibility: unsupported claims are removed and informative recovery paths are visible. Original business/logo/contact/legal approvals and real customer evidence remain missing; two points withheld.

Authenticated customer/staff/admin screens are not scored because only their safe entry states were available. See EXTERNAL-BLOCKERS.md. Improving these scores requires genuine evidence and remaining validation, not adjusting the weights or inventing favourable results.
