// buddyup legal texts: Terms of Service, Privacy Policy and Imprint (Impressum).
//
// FILL IN OPERATOR before publishing: German law (§ 5 DDG) requires your full name, an address
// where you can be served legal documents (no P.O. box) and a second fast way to reach you
// besides email. Then have a lawyer review these texts.
//
// When you change the Terms or Privacy Policy in a way users must agree to, bump VERSION:
// everyone is asked to accept the new version before they can continue (German law doesn't
// let silence count as agreement), and each acceptance is stored with its version and time.
window.BuddyLegal = (function () {
  const VERSION = "2026-10-18";
  const EFFECTIVE = "18/10/2026";

  const OPERATOR = {
    name: "Aakancha Jha",
    street: "Paul Schallück Str 13",
    city: "Cologne, 50939",
    country: "Germany",
    email: "contact@buddyup.fyi",
    phone: "+4915227513054",
    // The data protection authority of the German federal state you live in, e.g. "Berliner
    // Beauftragte für Datenschutz und Informationsfreiheit, Alt-Moabit 59-61, 10555 Berlin".
    authority: "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW), Kavalleriestraße 2-4, 40213 Düsseldorf, Germany",
    // Firebase console → Project settings → General → Default GCP resource location.
    firestoreRegion: "United States (Google Cloud multi-region nam5)",
  };

  const o = OPERATOR;
  const addressLine = `${o.street}, ${o.city}, ${o.country}`;
  const mail = `<a href="mailto:${o.email}">${o.email}</a>`;
  const head = (title) => `<h1>${title}</h1><p class="legal-meta">Version ${VERSION} · effective ${EFFECTIVE}</p>`;

  const terms = `
    ${head("Terms of Service")}

    <h2>1. About these Terms</h2>
    <p>1.1 These Terms of Service ("Terms") apply to your use of the buddyup website and service at buddyup.fyi ("buddyup"). buddyup is operated by ${o.name}, ${addressLine} ("we", "us"). You can reach us at ${mail}. Our full contact details are in the <a href="#/imprint">Imprint</a>.</p>
    <p>1.2 When you create an account and tick the box confirming that you agree to these Terms, a contract is concluded between you and us on the basis of these Terms. Any terms of your own do not apply.</p>
    <p>1.3 Our <a href="#/privacy">Privacy Policy</a> explains how we process your personal data. It is information for you, not part of this contract.</p>

    <h2>2. What buddyup is, and what it is not</h2>
    <p>2.1 buddyup is a free online platform that helps travellers find and contact other travellers ("buddies") and people who live in a city ("locals") so that they can meet in person. Our service consists of providing this platform: profiles, search, meetup requests, chat, reviews and reporting tools.</p>
    <p>2.2 We do not organise, arrange, supervise, attend or take part in meetups. Whether, when, where and how a meetup takes place is agreed solely between the users involved. We are not a party to any agreement between users.</p>
    <p>2.3 We are not a travel organiser, tour operator, travel agent or guiding service. We do not offer package travel or linked travel arrangements within the meaning of Directive (EU) 2015/2302 and sections 651a et seq. of the German Civil Code (BGB). Locals and buddies are private individuals acting on their own behalf. They are not our employees, agents or contractors and do not act on our behalf.</p>
    <p>2.4 buddyup is free of charge. We do not charge users and do not receive any share of anything users give each other. A tip is a voluntary gift from one user to another. Locals must not ask for payment (section 6). If a user nonetheless offers services for money, that user alone is responsible for complying with the applicable law, including tax, licensing and tour-guide rules.</p>

    <h2>3. Who may use buddyup</h2>
    <p>3.1 You must be at least 18 years old and have full legal capacity.</p>
    <p>3.2 You may have only one account. It is personal to you: do not let anyone else use it, keep your login details confidential and tell us immediately at ${mail} if you suspect that someone else is using your account.</p>
    <p>3.3 The information you give us and show on your profile, in particular your name, date of birth, city and profile photo, must be true, accurate and up to date. Your profile photo must clearly show you.</p>

    <h2>4. Verification of locals: what it does and does not mean</h2>
    <p>4.1 Before a local is shown to travellers, we review the information they give us: how long they have lived in the city, their neighbourhood and postcode, answers to questions about the city, and a photo ID that we compare with their profile photo.</p>
    <p>4.2 This review is a plausibility check carried out by a person with reasonable care. It is not a background check, criminal record check or reference check, and it cannot rule out that someone gives false information or behaves badly. A "verified" badge, a trust score and reviews are not a guarantee of anyone's identity, character, intentions or safety.</p>
    <p>4.3 We do not check the identity of travellers.</p>
    <p>4.4 We may refuse or withdraw verification if the information given is incomplete, implausible or false, or if there are other objective reasons to doubt it.</p>

    <h2>5. Meetups and your safety</h2>
    <p>5.1 You alone decide whether you meet someone, and when, where and for how long. You take part in meetups on your own responsibility.</p>
    <p>5.2 Please follow our safety guidelines (Safety page in the app). In particular: meet in busy public places, at least the first time; tell someone you trust who you are meeting, where and when; keep conversations on buddyup until you trust each other; and leave whenever you feel uncomfortable.</p>
    <p>5.3 You are responsible for your own conduct, health and belongings during meetups. We recommend that you have adequate travel, health and personal liability insurance.</p>
    <p>5.4 Meetup requests and acceptances are commitments between users. A meetup is arranged for a day; you agree on the time with the other person in the chat. You may cancel a meetup until the end of that day, giving a reason. The other person sees your reason. Cancelling a meetup that has already been confirmed is recorded on your profile and moves you lower in other people's search results (section 9.3).</p>
    <p>5.5 buddyup is not an emergency service and does not monitor meetups. In an emergency, contact the local emergency services (112 in the EU).</p>

    <h2>6. Rules of conduct</h2>
    <p>You must not use buddyup to:</p>
    <ol type="a">
      <li>break the law or infringe the rights of others;</li>
      <li>harass, threaten, stalk, intimidate, abuse or discriminate against anyone, or put pressure on anyone;</li>
      <li>seek or offer sexual services, escort services or paid companionship, or engage in any sexual contact without clear consent;</li>
      <li>ask for or offer money, or advertise goods or services (voluntary tips between users excepted);</li>
      <li>create fake profiles, impersonate anyone, or use someone else's photo or identity document;</li>
      <li>post content that is illegal, hateful, violent, sexually explicit or misleading, or other people's personal data without their consent;</li>
      <li>involve anyone under 18 in contact or meetups arranged through buddyup;</li>
      <li>bring or supply weapons, illegal drugs or other dangerous items to meetups;</li>
      <li>collect data about other users, use bots, scrapers or other automated means, or interfere with the security or operation of buddyup;</li>
      <li>keep contacting someone who has declined, cancelled, blocked you or otherwise made clear they do not want contact.</li>
    </ol>

    <h2>7. Your content</h2>
    <p>7.1 "Content" means everything you put on buddyup, such as your profile details, photos, messages, reviews and reports.</p>
    <p>7.2 Your content remains yours. You grant us a non-exclusive, royalty-free, worldwide right, limited to what is needed to operate buddyup, to store, reproduce (for example to resize photos), display and make your content available to other users as intended by the service. This right ends when your content or your account is deleted. For messages you have sent and reviews you have written, it continues for as long as they remain visible to the people you shared them with (see section 12.4).</p>
    <p>7.3 You are responsible for your content and confirm that you have the rights needed to post it. Reviews must be honest and based on a meetup that actually took place.</p>

    <h2>8. Reporting, moderation and complaints</h2>
    <p>8.1 You can report users or content that you believe to be illegal or in breach of these Terms, using "Report" on a profile or in a chat, or by email to ${mail}. Please explain why you consider the content illegal or in breach, where it can be found, and give your name and email address. We process reports in a timely, diligent, objective and non-arbitrary manner and let the reporting person know our decision.</p>
    <p>8.2 If there are sufficient indications of illegal content or a breach of these Terms, we may take proportionate measures: remove or hide content, reduce how visible a profile is, withdraw verification, or suspend or terminate an account. We take account of all circumstances, including how serious and how frequent the breach is and the legitimate interests and fundamental rights of everyone involved. These decisions are made by people; we do not use automated content moderation.</p>
    <p>8.3 If we restrict your content or account, we will tell you clearly and specifically why, unless the law prohibits this. You can complain to us about such a decision at ${mail} within six months; we will review the complaint and tell you the outcome. You may also turn to an out-of-court dispute settlement body certified under Article 21 of the Digital Services Act (Regulation (EU) 2022/2065) or to the courts.</p>
    <p>8.4 If we become aware of information giving rise to a suspicion that a criminal offence involving a threat to the life or safety of a person has taken place, is taking place or is likely to take place, we inform the competent law enforcement or judicial authorities (Article 18 of the Digital Services Act).</p>
    <p>8.5 We are not obliged to monitor content generally. Our single point of contact for users and authorities under Articles 11 and 12 of the Digital Services Act is ${mail}; you can write to us in English or German.</p>

    <h2>9. Our service</h2>
    <p>9.1 Because buddyup is free, there is no entitlement to any particular feature or to uninterrupted availability. We may change, restrict or discontinue features. We will tell you in good time before changes that significantly affect how you use buddyup, unless an immediate change is necessary for security or legal reasons.</p>
    <p>9.2 We do not guarantee that you will find a match, or that any user will reply to you or meet you.</p>
    <p>9.3 How search results are ranked: we only show people who are in the city on at least one of the same days as you. People who have just moved to a city are shown to each other until they have had a meetup together. Among them, people who have cancelled fewer confirmed meetups are shown first; after that, people with more matching times and more shared interests rank higher.</p>

    <h2>10. Liability</h2>
    <p>10.1 We are liable without limitation (a) for damage caused intentionally or through gross negligence, (b) for injury to life, body or health, (c) under the German Product Liability Act, and (d) where we have given a guarantee.</p>
    <p>10.2 In cases of slight negligence, we are liable only for breach of an essential contractual obligation, meaning an obligation whose fulfilment makes the proper performance of this contract possible in the first place and on whose fulfilment you may regularly rely. In that case our liability is limited to the damage that is typical for this kind of contract and foreseeable when it was concluded. Otherwise, liability for slight negligence is excluded.</p>
    <p>10.3 Sections 10.1 and 10.2 also apply to the personal liability of our representatives and the people we use to perform our obligations.</p>
    <p>10.4 As described in section 2, we are not a party to meetups and our obligations do not include supervising meetups or other users. We are therefore not responsible for the conduct, statements or content of other users or for what happens at or in connection with a meetup, unless the damage results from a breach of our own obligations; in that case sections 10.1 to 10.3 apply. For content posted by users, our responsibility as a hosting service is governed by Article 6 of the Digital Services Act.</p>
    <p>10.5 The statutory rules on the burden of proof remain unaffected.</p>

    <h2>11. Claims caused by your breach</h2>
    <p>If you culpably breach these Terms or the law, you must compensate us for the resulting damage and hold us harmless from claims that third parties bring against us because of your breach, including the reasonable costs of our legal defence at the statutory rates. This does not apply if you are not responsible for the breach. We will tell you promptly about any such claim and give you the opportunity to take part in the defence.</p>

    <h2>12. Term and termination</h2>
    <p>12.1 This contract runs for an indefinite period. You can end it at any time without notice by deleting your account (Profile → Delete account) or by emailing us.</p>
    <p>12.2 We can end it by giving you at least 30 days' notice by email.</p>
    <p>12.3 Either of us may end the contract without notice for good cause. Good cause for us includes in particular serious or repeated breaches of section 6, giving false identity information, and conduct that puts other users at risk. Where reasonable, we will first warn you or give you a deadline to remedy the breach.</p>
    <p>12.4 When the contract ends, your account is deleted as described in the Privacy Policy. Messages you have sent remain in the conversations of the people you sent them to, and reviews you have written remain on other people's profiles, signed "Former member".</p>

    <h2>13. Changes to these Terms</h2>
    <p>13.1 We may need to change these Terms, for example because the law or case law changes, because we add or change features, or to protect users' safety.</p>
    <p>13.2 We will show you the changes in buddyup and ask you to accept them before you continue using it. The changes only apply to you once you have accepted them. If you do not accept them, we may end the contract with notice under section 12.2; until then, the previous Terms continue to apply.</p>

    <h2>14. Right of withdrawal</h2>
    <p>buddyup is free, and we process your personal data only to provide the service and to meet our legal obligations. The statutory right of withdrawal for distance contracts therefore does not normally apply (section 312(1a), second sentence, BGB). You can end the contract at any time under section 12.1.</p>

    <h2>15. Applicable law and disputes</h2>
    <p>15.1 The law of the Federal Republic of Germany applies, excluding the UN Convention on Contracts for the International Sale of Goods. If you are a consumer and live in another country, this choice of law does not deprive you of the protection of the mandatory provisions of the law of the country where you live (Article 6(2) of the Rome I Regulation).</p>
    <p>15.2 If you are a consumer, you may bring proceedings against us in the courts of the country where you live or in Germany, and we may bring proceedings against you only in the courts of the country where you live.</p>
    <p>15.3 We are neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board (section 36 of the German Consumer Dispute Resolution Act, VSBG).</p>

    <h2>16. Final provisions</h2>
    <p>16.1 If any provision of these Terms is or becomes invalid, the rest of the Terms remain valid. The statutory provisions apply in place of the invalid provision.</p>
    <p>16.2 We may transfer this contract to a company that we set up to operate buddyup. We will tell you at least 30 days in advance; you may then end the contract at any time.</p>
    <p>16.3 These Terms are written in English. You can save or print them at any time from this page.</p>`;

  const privacy = `
    ${head("Privacy Policy")}

    <h2>1. Who is responsible</h2>
    <p>The controller responsible for processing your personal data on buddyup within the meaning of the General Data Protection Regulation (GDPR) is ${o.name}, ${addressLine}, email ${mail}. We have not appointed a data protection officer because we are not required to.</p>

    <h2>2. What we process, why, on what legal basis and for how long</h2>
    <h3>2.1 Your account</h3>
    <p>Email address, password (stored only in encrypted form by our provider Firebase Authentication) or, if you sign in with Google, your Google account identifier, name, email and profile picture. Purpose: creating your account and letting you sign in. Legal basis: Art. 6(1)(b) GDPR (performing our contract with you). Kept until you delete your account.</p>
    <h3>2.2 Your profile</h3>
    <p>Name, profile photo, age (calculated from your date of birth), where you are from or the city you live in, interests, the "about you" text, languages, whether you are using buddyup as a traveller or local, your trip (city and dates, or that you have just moved there), the days a local is free, ratings and reviews, the number of confirmed meetups you have cancelled, and, for locals, verification status, trust score and how long they have lived in the city. Your profile is visible to other signed-in users; it is what lets people find and decide to meet each other. Legal basis: Art. 6(1)(b) GDPR. Kept until you delete your account.</p>
    <h3>2.3 Your date of birth</h3>
    <p>We use your date of birth to confirm that you are at least 18 and to show your age on your profile. The date itself is visible only to you; others see only your age. Legal basis: Art. 6(1)(b) GDPR. Kept until you delete your account.</p>
    <h3>2.4 Local verification</h3>
    <p>If you apply to become a local: how long you have lived in the city, your neighbourhood and postcode, your answers to questions about the city, your safety commitments, any notes from our checks, and a photo of your identity document. A person on our team compares the photo on your ID with your profile photo by eye; we do not use automated facial recognition or any other biometric processing. You may black out all information on your ID that we do not need, keeping only your photo, name, date of birth and the document's expiry date. Purpose: making sure that locals are who they say they are and live where they say they do, to protect travellers. Legal basis: Art. 6(1)(b) GDPR and our legitimate interest in the safety of our users, Art. 6(1)(f) GDPR. Your ID photo is visible only to our review team. It is deleted automatically when your application is approved (the next time you open buddyup) and otherwise within 30 days of our decision. Your other verification answers are kept until you delete your account.</p>
    <p>To check that your postcode matches your neighbourhood, your browser sends the neighbourhood, city and postcode you entered (together with your IP address, as with any web request) to the geocoding service Nominatim of the OpenStreetMap Foundation, St John's Innovation Centre, Cowley Road, Cambridge, CB4 0WS, United Kingdom, which processes the data as an independent controller. The United Kingdom has an adequacy decision of the European Commission. Legal basis: Art. 6(1)(b) and (f) GDPR.</p>
    <h3>2.5 Meetups, messages and reviews</h3>
    <p>Meetup requests (time, message, status, cancellation reasons), chat messages and reviews, together with the names and photos of the people involved. They are shared with the other person in the meetup or conversation; reviews are visible on profiles. Legal basis: Art. 6(1)(b) GDPR. Kept until you delete your account. When you delete your account, messages you have sent stay in the other person's conversation and your reviews stay on their profile, signed "Former member", because they are part of that person's own communication and reputation on buddyup (Art. 6(1)(f) GDPR). If you delete a chat, it is hidden only for you.</p>
    <h3>2.6 Reports and moderation</h3>
    <p>If you report someone, we process your report (reason, details, the person and conversation concerned). If someone reports you, we process the report and the content concerned. Purpose: handling reports, keeping buddyup safe and meeting our obligations under the Digital Services Act. Legal basis: Art. 6(1)(c) GDPR in conjunction with Articles 16 to 18 of the Digital Services Act, and Art. 6(1)(f) GDPR. The person you report is not told who reported them. Reports are kept for as long as needed to handle them and for up to 12 months afterwards, or longer if needed to establish, exercise or defend legal claims.</p>
    <h3>2.7 Your agreement to our Terms</h3>
    <p>Which version of the Terms of Service you accepted and when. Purpose: being able to prove our contract with you. Legal basis: Art. 6(1)(f) GDPR. Kept for as long as your account exists and for three years after the end of the year in which it is deleted (the general limitation period).</p>
    <h3>2.8 Emails to us</h3>
    <p>If you email us, we process your email address and what you write to answer you. Legal basis: Art. 6(1)(b) or (f) GDPR. Kept for as long as needed to deal with your request.</p>
    <h3>2.9 Visiting the website</h3>
    <p>When you open buddyup, our hosting provider Cloudflare processes your IP address, the pages and files requested, date and time, and your browser's technical information, to deliver the website and protect it against attacks. Legal basis: Art. 6(1)(f) GDPR (secure and reliable operation). These logs are kept only briefly, as set out in Cloudflare's policies. We load fonts and program code from our own website, not from third-party servers.</p>
    <h3>2.10 Storage in your browser</h3>
    <p>To keep you signed in, Firebase stores a sign-in token in your browser's storage. This is strictly necessary for the service you requested (section 25(2) no. 2 of the German Telecommunications Digital Services Data Protection Act, TDDDG), so we do not ask for consent. We do not use cookies or similar technologies for analytics, advertising or tracking, and we do not show ads.</p>

    <h2>3. Who receives your data</h2>
    <p><b>Other users</b> see your profile, and the people you meet or chat with see your meetups and messages with them, as described above.</p>
    <p><b>Service providers</b> who process data on our behalf under data processing agreements (Art. 28 GDPR):</p>
    <ul>
      <li>Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Ireland, with its parent Google LLC, USA (Firebase Authentication and Cloud Firestore: accounts, profiles, meetups, chats, reviews, reports and ID photos). Data location: ${o.firestoreRegion}.</li>
      <li>Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA (hosting and delivery of the website, storage of profile photos in Cloudflare R2, and forwarding of emails sent to ${o.email}).</li>
    </ul>
    <p><b>Authorities</b>, where we are legally obliged to disclose data, for example under Article 18 of the Digital Services Act.</p>
    <p>We do not sell your data and do not share it with advertisers.</p>

    <h2>4. Transfers outside the EU</h2>
    <p>Our Firebase database is located in the United States, and Google LLC and Cloudflare, Inc. may also process other data there. Both are certified under the EU-U.S. Data Privacy Framework, for which the European Commission has adopted an adequacy decision (Art. 45 GDPR). In addition, we have agreed the European Commission's Standard Contractual Clauses with them (Art. 46(2)(c) GDPR).</p>

    <h2>5. Automated decisions</h2>
    <p>We do not make decisions based solely on automated processing that have legal or similarly significant effects on you (Art. 22 GDPR). The trust score only helps our team review an application; a person decides whether a local is approved. Search results are sorted as described in section 9.3 of our Terms.</p>

    <h2>6. Your rights</h2>
    <p>You have the right to access your data (Art. 15 GDPR), to have it corrected (Art. 16), erased (Art. 17) or its processing restricted (Art. 18), to receive it in a portable format (Art. 20), and to object to processing based on our legitimate interests on grounds relating to your particular situation (Art. 21). You can edit your profile and delete your account yourself in the app (Profile → Delete account); for anything else, email ${mail}.</p>
    <p>You also have the right to lodge a complaint with a data protection supervisory authority, in particular in the EU country where you live or work or where you believe a breach occurred. The authority responsible for us is: ${o.authority}.</p>

    <h2>7. Do you have to provide your data?</h2>
    <p>Your name, email address, date of birth and a profile photo are needed to conclude and perform our contract. Without them you cannot use buddyup. Locals must also provide their verification information to be shown to travellers.</p>

    <h2>8. Security</h2>
    <p>Data is transmitted in encrypted form (TLS). Access rules ensure that private details, ID photos and conversations are only accessible to the people entitled to see them, and profile photos are only delivered to signed-in users.</p>

    <h2>9. Changes</h2>
    <p>We will update this policy if our processing changes and will tell you about significant changes in buddyup.</p>`;

  const imprint = `
    <h1>Imprint</h1>
    <p class="legal-meta">Information pursuant to § 5 DDG (German Digital Services Act)</p>
    <p>${o.name}<br/>${o.street}<br/>${o.city}<br/>${o.country}</p>
    <h2>Contact</h2>
    <p>Email: ${mail}<br/>Phone: ${o.phone}</p>
    <h2>Consumer dispute resolution</h2>
    <p>We are neither obliged nor willing to take part in dispute resolution proceedings before a consumer arbitration board.</p>`;

  return { VERSION, OPERATOR, pages: { terms, privacy, imprint } };
})();
