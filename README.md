# CSV to ICS Shiftmaker
Live page: https://aamirtechs.github.io/csv-to-ics-shiftmaker/

Turn a roster, class schedule or event spreadsheet into a calendar file with timezones, recurrence and reminders that actually imports cleanly. Built for ops and roster managers, teachers and event organisers who would otherwise type hundreds of events by hand.

## Features
- CSV and XLSX upload with column mapping for title, start, end, location and notes
- Timezone selection with ambiguous-date warnings and preview cards
- Recurrence builder for daily, weekly and monthly rules with count or until, validated before export
- Reminder offsets of 15 minutes, 1 hour and 1 day via VALARM
- Strict ICS output with escaping, 75-octet line folding and UTC or TZID timestamps

## How it works
Upload a CSV or XLSX file, map the title, start, end, location and notes columns, pick a timezone and optional recurrence and reminder, preview the events, then download a validated .ics file. It runs entirely in the browser.

## Privacy
Runs 100% in your browser. Your files never leave this device, nothing is uploaded, and there is no tracking.

## Development
Core logic lives in `src/logic.js` and is shared by the page and the tests. Run the tests with `npm test`.

## License
MIT, Copyright 2026 Amir Hussain.
