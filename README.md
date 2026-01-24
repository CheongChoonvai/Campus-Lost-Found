SRS Document
Campus Lost & Found System
Prepared by: Cheong Choonvai
Date: 22 Jan 2026
1. Introduction
1.1 Purpose
The primary objective of the Campus Lost & Found project is to digitize and streamline the way lost property is managed within our university. Currently, campus members rely on fragmented methods like physical notice boards or social media groups. This system provides a centralized digital hub where staff and students can efficiently report, browse, and reclaim items with higher transparency and speed.
1.2 Scope
This web-based application is designed to be a "one-stop shop" for property recovery. It covers the entire lifecycle of an item—from the initial report (including photo evidence) to the final handover. Key functionalities include:
Reporting: Simple forms for both lost and found property.
Discovery: A searchable, filterable feed for all active reports.
Connection: Secure channels for users to contact one another to coordinate the return of items.
1.3 Target Audience
The system is tailored for the diverse campus population, specifically Students and Faculty who need a quick mobile solution, and Administrative Staff who may need to monitor or manage high volumes of reported items.
2. Overall Description
2.1 Product Perspective
This is a modern, standalone web application. To ensure high performance and real-time updates, the system utilizes a Next.js frontend paired with Supabase for backend logic, authentication, and database management.
2.2 User Classes and Characteristics
We have categorized our users into two distinct levels of access to maintain data integrity:
Guests: Individuals who can browse the public feed to look for their items but must register to see contact details or file a report.
Authenticated Users: Registered members who have full access to report items and manage their personal history of posts.
2.3 Operating Environment
Because students are often on the move, the system is built with a Mobile-First philosophy. It is fully optimized for modern browsers (Chrome, Safari, Edge) across smartphones, tablets, and laptops.
3. System Features
3.1 Authentication & User Access
To protect user privacy, a secure login system is mandatory.
Registration and login via campus email.
Automated password recovery and session persistence so users don't have to log in repeatedly.
3.2 Dynamic Dashboard
The Dashboard serves as the "Living Feed" of the campus.
Real-time Feed: Displays the most recently reported items first.
Smart Search: Users can search by keywords (e.g., "iPhone") or filter by categories like "Electronics" or "Wallets".
3.3 The Reporting Workflow
This is the core functional area of the site.
Rich Uploads: Users can snap a photo on their phone and upload it directly to the report.
Contextual Data: The form captures the where, when, and what of the item to help finders/owners identify it quickly.
3.4 Item Lifecycle Management
Users aren't just reporting items; they are managing them.
Owners can update descriptions if they remember more details.
Crucially, users can mark an item as "Resolved" once it is returned, removing it from the active feed to keep the dashboard clean.
4. Non-Functional Requirements
4.1 Usability & Design
The interface is designed to be "frictionless." Navigation should be self-explanatory, even for first-time users, with a heavy emphasis on mobile responsiveness.
4.2 Performance & Reliability
Pages should load in under 2 seconds. We utilize optimized image compression to ensure that high-resolution photos don't slow down the user experience. Data consistency is guaranteed via Supabase's PostgreSQL backend.
4.3 Privacy and Data Security
Security is handled at the database level using Row Level Security (RLS). This ensures that while everyone can see a post, only the original poster has the permission to edit or delete it.

5. Technology Stack Summary
Frontend: Next.js (React) for a fast, SEO-friendly interface.
Backend & DB: Supabase (PostgreSQL) for secure data storage.
Hosting: Vercel for seamless deployment and global availability.

