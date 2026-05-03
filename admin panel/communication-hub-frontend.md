# Communication Hub — Frontend Spec

**File:** `src/app/admin/communication/page.tsx`  
**Component:** `CommunicationHub`

---

## Layout Overview

Three-column layout on desktop, tabs on mobile.

```
┌──────────────────────────────────────────────────────────────┐
│  [Announcements Tab]  [Driver Dispatch Tab]  [SOS Center Tab]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Tab Panel (active tab content fills full area)             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**SOS Override:** when an SOS alert is active, a full-screen overlay replaces all tab content. See `SOSResponseOverlay` below.

---

## Components

### `CommunicationHub` (page root)

**State:**
- `activeTab: 'announcements' | 'dispatch' | 'sos'`
- `sosActive: boolean` — set to `true` when SOS WebSocket message received
- `sosAlert: SOSAlert | null`

**On mount:** connect to `ws://[host]/ws/admin` and listen for `panic` events

**SOS listener:**
```ts
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'panic') {
    setSosAlert(msg.payload);
    setSosActive(true);
  }
};
```

**When `sosActive` is true:** render `SOSResponseOverlay` on top of all other content (portal, `z-index` above everything)

---

### `AnnouncementForm`

**File:** `src/app/admin/communication/components/AnnouncementForm.tsx`

**Props:** none (self-contained with own state)

**State:**
- `title: string`
- `message: string`
- `targetType: 'global' | 'route-specific'`
- `selectedRouteId: string | null` (only when `targetType = 'route-specific'`)
- `isSubmitting: boolean`

**Layout:**

```
┌─────────────────────────────────┐
│  Title input (text)             │
│  Message textarea               │
│  Target:  ○ Global  ○ Route     │
│  [Route selector — conditional] │
│  [Send Announcement button]     │
└─────────────────────────────────┘
```

**Behavior:**
- "Global" sends to all students
- "Route-specific" shows a route dropdown; sends to students subscribed to that route only
- On submit: `POST /api/admin/announcements`
- Show success toast: "Announcement sent to [N] students"
- Clear form on success

**Validation:**
- Title: required, max 100 chars
- Message: required, max 500 chars
- Route: required if `targetType === 'route-specific'`

---

### `DriverDispatchPanel`

**File:** `src/app/admin/communication/components/DriverDispatchPanel.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────────┐
│  [Driver Selector — left sidebar, 200px]            │
│  ┌────────────────────────────────────────────────┐ │
│  │  Chat thread (scrollable, flex-col-reverse)    │ │
│  │  ...messages...                                │ │
│  │  [Input + Send button — sticky bottom]         │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

**State:**
- `selectedDriverId: string | null`
- `messages: DispatchMessage[]`
- `inputText: string`
- `ws: WebSocket`

**Driver selector:** scrollable list of online drivers; shows driver name and bus number; online indicator dot

**WebSocket behavior:**
- Connect to `/ws/admin/dispatch` on mount
- On driver select: send `{ type: 'join_thread', driverId }` to load message history
- Incoming messages: append to `messages` if `driverId` matches selected driver
- Send message: `{ type: 'dispatch_message', driverId, text }`

**Message bubble layout:**
- Admin messages: right-aligned
- Driver messages: left-aligned
- Timestamp shown on hover

---

### `SOSResponseOverlay`

**File:** `src/app/admin/communication/components/SOSResponseOverlay.tsx`

**Props:**
```ts
interface SOSResponseOverlayProps {
  alert: SOSAlert;
  onDismiss: () => void;
}
```

**Behavior:**
- Renders as a full-viewport overlay using a React portal (appended to `document.body`)
- Uses the existing "danger/critical" style tokens for background and border — no custom colors specified here
- Plays an audible alert on mount:
  ```ts
  useEffect(() => {
    const audio = new Audio('/sounds/sos-siren.mp3');
    audio.loop = true;
    audio.play();
    return () => audio.pause();
  }, []);
  ```
- Dismiss button stops audio and sets `sosActive = false` in parent — requires explicit admin confirmation (e.g., "Confirm Acknowledged" button, not just any click)

**Content:**
```
┌─────────────────────────────────────────────────┐
│  ⚠  SOS ALERT                                   │
│                                                 │
│  Bus:    TN-01-AB-1234                          │
│  Driver: Ramesh Kumar                           │
│  Route:  Main Gate → Porur                      │
│  Time:   14:32:07                               │
│  Location: [lat, lng / nearest stop name]       │
│                                                 │
│  [Call Driver]   [Confirm Acknowledged]         │
└─────────────────────────────────────────────────┘
```

**"Call Driver" button:** opens `tel:` link with driver's phone number

---

## Types

```ts
interface SOSAlert {
  busId: string;
  busNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  routeName: string;
  lat: number;
  lng: number;
  nearestStop: string;
  triggeredAt: string;
}

interface DispatchMessage {
  id: string;
  driverId: string;
  sender: 'admin' | 'driver';
  text: string;
  sentAt: string;
}
```

---

## Audio Asset

Place at: `public/sounds/sos-siren.mp3`  
Keep file size under 100KB (short loop, compressed). Source from a royalty-free library or generate programmatically using Web Audio API as fallback.

---

## Notification Integration

When announcement is sent successfully, the `Header.tsx` notification center must display it. This requires:
- Either a shared state/context for notifications
- Or a WebSocket push from the server that the `Header.tsx` listens to

Recommended: server pushes a `notification_update` event on `/ws/notifications` which `Header.tsx` already subscribes to.
