import { Container } from "react-bootstrap";

const points = [
	{
		title: "1) Oggetto e definizioni",
		text: `Il presente documento disciplina l'adesione delle aziende (\"Venditori\") al marketplace Lucaniko Shop e l'utilizzo degli strumenti messi a disposizione per la vendita ai consumatori finali.`
	},
	{
		title: "2) Requisiti di ammissione",
		text: `Possono candidarsi aziende con sede operativa/legale in Basilicata o che producono/vendono prodotti riconducibili al territorio lucano (criteri definiti da Lucaniko Shop).\nIl Venditore deve fornire dati completi e veritieri (ragione sociale, P. IVA, sede, referente, contatti, SDI, ecc.).\nLucaniko Shop si riserva di richiedere documentazione aggiuntiva e di approvare o rifiutare la candidatura.\nPer la categoria di vendita CIBI E BEVANDE è obbligatorio offrire su questo marketplace solo prodotti Lucani. Tutti i prodotti non Lucani saranno rimossi senza alcun avviso e potrebbe comportare l'esclusione del venditore da Lucaniko Shop.`
	},
	{
		title: "3) Piano di Adesione e attivazione",
		text: `Piano di Adesione 2026 (come da offerta in piattaforma):\n- €250 (IVA inclusa) / 1 anno\n- €390 (IVA inclusa) / 2 anni\n- €510 (IVA inclusa) / 3 anni\nINCLUDE:\n- Registrazione e accesso alla piattaforma\n- Onboarding e formazione iniziale\n- Supporto operativo \n- Accesso alla community WhatsApp aziende Lucaniko Shop (guide pratiche, best pratices, aggiornamenti, news)\nL'accesso è attivato dopo:\n- approvazione della richiesta\n- pagamento effettuato online\n- emissione fattura da parte di INSIDE DI DI PIETRO VITO\nIl venditore potrà scegliere se rinnovare o meno la partnership alla scadenza (in caso di non rinnovo, il venditore dovrà inviare una email di disdetta, con tutti i dati aziendali di registrazione, in allegato un documento d'identità del titolare, entro 60 giorni dalla data di scadenza). In caso di mancato avviso, il rinnovo sarà automatico. \nPrivacy e Sicurezza: Lucaniko Shop garantisce la privacy dei dati personali e si impegna a proteggere le informazioni sensibili. Consulta la nostra privacy policy.`
	},
	{
		title: "4) Commissioni sulle vendite e pagamenti",
		text: `- Nessuna commissione di marketplace, salvo diverso accordo.\n- I pagamenti sono gestiti tramite Stripe: il Venditore deve creare/configurare il proprio account Stripe e completare eventuali verifiche (KYC/AML).\n- Stripe accredita direttamente al Venditore gli importi delle vendite al netto delle commissioni Stripe e di eventuali trattenute richieste da Stripe.`
	},
	{
		title: "5) Obblighi del Venditore (prodotti, conformità e leggi)",
		text: `Il Venditore è l'unico responsabile di:\n- veridicità delle schede prodotto (descrizioni, ingredienti, taglie, compatibilità ricambi, certificazioni)\n- conformità normativa (es. etichettatura alimentare, sicurezza prodotti, marcatura, RAEE, garanzie)\n- disponibilità, prezzi, IVA, emissione documenti fiscali (fattura/scontrino dove previsto)\n- gestione resi, recesso, rimborsi, garanzia e assistenza post-vendita\n- gestione spedizioni e consegne\nLucaniko Shop non garantisce esclusiva di prodotto nè di prezzo. Più venditori possono offrire prodotti uguali o simili anche a prezzi differenti.\nÈ vietato vendere prodotti illegali, contraffatti, pericolosi o soggetti a restrizioni non gestibili sulla Piattaforma.`
	},
	{
		title: "6) Spedizioni",
		text: `Il Venditore imposta aree servite, tempi, corrieri e costi.\nIl Venditore è responsabile di imballaggio, integrità e tracciamento.`
	},
	{
		title: "7) Termini di vendita del Venditore",
		text: `Ogni Venditore deve pubblicare i propri Termini e Condizioni di vendita (spedizioni, resi, recesso, garanzie, contatti), che l'Acquirente dovrà accettare in fase di checkout.`
	},
	{
		title: "8) Pagina venditore e contenuti",
		text: `Il Venditore può avere una pagina dedicata con:\n- logo e descrizione\n- contatti cliccabili (telefono, email, sito, social)\n- indirizzo\n- catalogo prodotti\nIl Venditore garantisce di avere i diritti d'uso su logo, immagini e testi caricati e manleva Lucaniko Shop da rivendicazioni di terzi.`
	},
	{
		title: "9) Uso della Piattaforma e condotte vietate",
		text: `È vietato:\n- utilizzare la Piattaforma per finalità illecite\n- inserire contenuti ingannevoli o non conformi\n- aggirare i flussi di pagamento della Piattaforma se non autorizzato\n- sollecitare pagamenti esterni per ordini generati dal marketplace`
	},
	{
		title: "10) Sospensione e cessazione",
		text: `Lucaniko Shop può sospendere o disattivare l'account venditore (anche senza preavviso nei casi gravi) in caso di:\n- violazioni normative o dei presenti Termini\n- contestazioni ripetute, frodi, prodotti vietati\n- inadempimenti gravi nella gestione ordini/resi\nIl Venditore può recedere dall'adesione secondo le modalità indicate; gli importi del Piano di Adesione già pagati possono essere non rimborsabili salvo obblighi di legge o diversa previsione contrattuale.`
	},
	{
		title: "11) Trattamento dati: ruoli e responsabilità",
		text: `Lucaniko Shop è titolare dei dati necessari alla gestione della Piattaforma.\nIl Venditore è titolare autonomo dei dati necessari alla gestione degli ordini (spedizione, fatturazione, assistenza).\nLe parti si impegnano a trattare i dati nel rispetto del GDPR e a fornire informative e misure di sicurezza adeguate.`
	},
	{
		title: "12) Limitazione di responsabilità e manleva",
		text: `Il Venditore manleva Lucaniko Shop da danni, sanzioni, reclami e pretese derivanti da:\nprodotti non conformi o pericolosi\nviolazioni di legge (fiscali, consumatori, etichettatura)\nviolazioni di proprietà intellettuale\ngestione ordini, spedizioni, resi e rimborsi\nVariazione Termini & Condizioni\nLucaniko Shop si riserva il diritto di modificare i Termini & Condizioni in qualsiasi momento con efficace immediata dalla pubblicazione sul sito`
	},
	{
		title: "13) Legge applicabile e foro",
		text: `Il rapporto è regolato dalla legge italiana. Foro competente di Potenza.`
	}
];

const TermsVendors = () => (
	<Container className="py-5" style={{ maxWidth: 800 }}>
		<h2 className="mb-4">Termini & Condizioni Venditori</h2>
		<div style={{ fontSize: "1.05rem", lineHeight: 1.7 }}>
			{points.map((p, i) => (
				<div key={i} style={{ marginBottom: 28 }}>
					<strong>{p.title}</strong>
					<div style={{ whiteSpace: "pre-line", marginTop: 6 }}>{p.text}</div>
				</div>
			))}
		</div>
	</Container>
);

export default TermsVendors;
