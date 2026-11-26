# Hilltop Property Assistant

The public widget is deterministic and does not claim to be an AI model. It provides approved quick actions and turns a short request into validated catalogue URL filters for listing type, supported location, bedrooms and maximum ZMW budget. Search results remain governed by the existing catalogue query and public RLS.

The widget does not persist conversation history or request passwords, payment details or private account information. User text is read as plain input and is never inserted as HTML. Unsupported needs route to the public contact and sales journeys.

The WhatsApp launcher is rendered only when `VITE_WHATSAPP_NUMBER` contains an approved direct number. It is intentionally absent when configuration is missing. The existing WhatsApp channel link remains a separate destination.
