# 🛒 Grocery List - Monthly Planner

A beautiful, responsive grocery list web app built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**. Organize your shopping by month with smooth animations and a premium user experience.

## ✨ Features

- **Month-wise Organization**: Create and manage grocery lists for different months
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Premium Animations**: Smooth Framer Motion animations throughout
- **Bilingual Support**: Marathi + English item names
- **Auto-categorization**: Items grouped by Grains, Pulses, Spices, Dairy, Snacks, Beverages, Other
- **LocalStorage Persistence**: Your data saves automatically in the browser
- **Export Lists**: Download monthly lists as text files
- **Quantity Editing**: Set custom quantities for each item
- **Check Off Items**: Mark items as bought with satisfying animations

## 🚀 Quick Start (Local)

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📦 Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** 5
- **Tailwind CSS** 3.4
- **Framer Motion** 11
- **Vercel** (deployment)

## 🎨 Design Highlights

- Clean, modern UI with glassmorphism effects
- Spring-based animations for natural movement
- Staggered list transitions
- Smooth modal and tab animations
- Touch-optimized mobile experience
- Hover states and visual feedback

## 📁 Project Structure

```
app/
  layout.tsx          # Root layout
  page.tsx            # Main page component
  globals.css         # Global styles + Tailwind
components/
  Header.tsx          # App header with stats
  MonthSelector.tsx   # Tabbed month navigation
  GroceryCatalog.tsx  # Modal with searchable catalog
  MonthlyList.tsx     # List of items for the month
  ui/
    Button.tsx        # Custom button with animations
    Card.tsx          # Card component
hooks/
  useLocalStorage.ts  # State persistence hook
lib/
  grocery-data.ts     # Catalog with Marathi/English translations
  animations.ts       # Framer Motion variants
types/
  index.ts            # TypeScript interfaces
```

## 🌐 Deploy to Vercel

Click the button below to deploy:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/grocery-list)

Or manually:
```bash
vercel --prod
```

## 📝 Data

The grocery catalog includes 33 items in Marathi with English translations, covering:
- Grains (rice, wheat, oats, millets, flours)
- Pulses (lentils, gram flour)
- Spices (chili, turmeric, salt, hing, baking soda)
- Dairy (milk, ghee, butter, milk powder)
- Snacks (poha, biscuits)
- Beverages (tea, coffee)
- Miscellaneous (coconut, baking powder, medicines, glucose, mango, oil)

## 🎯 Future Enhancements

- Backend API with database (Supabase/Firebase)
- User authentication
- Share lists with family
- Recurring items (weekly/monthly)
- Shopping cost tracking
- Multi-language support expansion
- Dark mode
- PWA support

## 📄 License

MIT

---

Built with ❤️ and really good animations.
