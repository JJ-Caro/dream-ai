# Dream AI — Monetization Options

*Research by Alf, January 26, 2026*

---

## 🏆 RECOMMENDED: RevenueCat

**Why:** Industry standard for Expo/React Native. Handles all the complexity.

### Pricing
- **Free** until $2,500 MTR (monthly tracked revenue)
- **1% of MTR** above $2,500/month
- Enterprise for high volume

### What You Get
- Wraps StoreKit (iOS) + Google Play Billing (Android)
- Receipt validation server-side (no backend needed)
- Subscription analytics dashboard
- A/B testing for paywalls
- Pre-built paywall UI templates

### Integration (Expo)
```bash
npx expo install react-native-purchases
```

```typescript
import Purchases from 'react-native-purchases';

// Initialize
Purchases.configure({ apiKey: 'your_revenuecat_key' });

// Check subscription status
const customerInfo = await Purchases.getCustomerInfo();
const isPro = customerInfo.entitlements.active['pro'] !== undefined;

// Show paywall
const offerings = await Purchases.getOfferings();
const package = offerings.current?.availablePackages[0];
await Purchases.purchasePackage(package);
```

### Trial Setup
- Configure in App Store Connect / Google Play Console
- RevenueCat automatically handles trial → paid conversion
- Can set 7-day free trial with RevenueCat dashboard

**Time to integrate: 2-4 hours**

---

## 🥈 ALTERNATIVE: Superwall

**Why:** Better paywall A/B testing and UI customization

### Pricing
- **Free** up to $10k MTR
- 1% above that

### Features
- Remote paywall configuration (no app updates needed)
- Beautiful pre-built paywall templates
- Advanced A/B testing
- Works WITH RevenueCat (Superwall for UI, RevenueCat for backend)

### Expo SDK
```bash
npx expo install @superwall/react-native-superwall
```

**Time to integrate: 3-5 hours**

---

## ❌ NOT RECOMMENDED: Stripe Direct

**Why not for mobile apps:**
- Apple takes 30% anyway (App Store rule)
- You'd still need StoreKit integration
- More complex than RevenueCat

**When Stripe makes sense:**
- Web-only subscriptions
- B2B/enterprise billing
- You need invoicing

---

## 📱 IMPLEMENTATION PLAN FOR DREAM AI

### Week 1: Setup
1. Create RevenueCat account (free)
2. Create products in App Store Connect:
   - `dream_pro_weekly` — $4.99/week
   - `dream_pro_monthly` — $9.99/month
   - `dream_pro_yearly` — $49.99/year (best value)
3. Configure 7-day free trial

### Week 2: Integration
1. Install `react-native-purchases`
2. Add entitlement check to dream analysis feature
3. Create simple paywall screen
4. Test on TestFlight

### Paywall Trigger Points
- After 3 free dream analyses
- OR after 7 days of use
- Soft paywall (can dismiss) vs Hard paywall (must subscribe)

---

## 💰 PRICING RESEARCH (Dream/Wellness Apps)

| App | Weekly | Monthly | Yearly |
|-----|--------|---------|--------|
| Headspace | — | $12.99 | $69.99 |
| Calm | — | $14.99 | $69.99 |
| Reflectly | $9.99 | — | $47.99 |
| Dream Decoder | $4.99 | $9.99 | $39.99 |

**Recommendation for Dream AI:**
- Weekly: $3.99-4.99
- Monthly: $7.99-9.99
- Yearly: $39.99-49.99 (highlight as "best value")

---

## ⚠️ SUPABASE STATUS

The `.env` file only has placeholders — no actual keys.

To test the app, you need:
1. Supabase project URL + anon key
2. Gemini API key (you have one in TOOLS.md: `AIzaSyCHo1vbFMjH536NSeAMH801PRf1sS7h-DQ`)
3. OpenAI API key (for speech-to-text)

**Do you have an active Supabase project for Dream AI?** If not, I can help set one up.

---

## 🚀 TL;DR

1. **Use RevenueCat** — free to start, handles everything
2. **7-day free trial** — then $9.99/month or $49.99/year
3. **Paywall after 3 analyses** — or after trial ends
4. **Need Supabase keys** — to actually run the app

Want me to start the RevenueCat integration?
