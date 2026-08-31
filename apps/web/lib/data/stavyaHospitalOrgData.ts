export interface HospitalStaffMember {
  id: string;
  code: string;
  name: string;
  unit: string;
  desig: string;
  reports: string;
  note?: string;
  dept_master: string;
  mobile: string;
  other?: string;
  email: string;
  omail?: string;
  blood?: string;
  gender: string;
  marital?: string;
  dob?: string;
  join: string;
  worker: string;
  emp: string;
  shift: string;
  skill: string;
  edu1?: string;
  exp1?: string;
  branch: string;
}

export interface UnitGroup {
  type: 'group';
  name: string;
  head: string | null;
  head_title: string;
  children: (UnitGroup | UnitLeaf)[];
}

export interface UnitLeaf {
  type: 'leaf';
  name: string;
}

export interface GovernanceMember {
  name: string;
  title: string;
  role: string;
}

export interface HospitalOrgStructure {
  governance: GovernanceMember[];
  clinical: (UnitGroup | UnitLeaf)[];
  admin: (UnitGroup | UnitLeaf)[];
  heads: Record<string, string>;
}

// 211 Hospital Staff records confirmed by MD
export const STAVYA_STAFF_DATABASE: Record<string, HospitalStaffMember> = {
  "e000": {"id":"e000","code":"113","name":"Abhishek Jayshankar Dubey","unit":"Facility Operations","desig":"Maintainance Co-Ordinator","reports":"Zankhana Chirag Joshi","dept_master":"SECURITY","mobile":"7486038911","other":"9998344190","email":"dubeyabhishek8070@gmail.com","omail":"","blood":"A+","gender":"male","marital":"Single","dob":"20-06-1995","join":"01-04-2015","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 10 hours","skill":"UNSKILLED","branch":"Ahmedabad"},
  "e001": {"id":"e001","code":"130","name":"Aditi Rakeshkumar Patel","unit":"Radiology","desig":"Radiographer","reports":"Dr. Preety Ajay Krishnan","dept_master":"X-RAY","mobile":"7600169389","other":"7990699503","email":"aditipatel9727@gmail.com","omail":"","blood":"O+","gender":"female","marital":"Single","dob":"27-04-1998","join":"01-02-2020","worker":"Company Staff","emp":"Confirm","shift":"General shift - 8:00-4:30","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e002": {"id":"e002","code":"193","name":"Adityaraj Guatambhai Rathod","unit":"IPD & HDU Nursing","desig":"Junior Nursing Staff","reports":"Manilal Mangilal Hadat","dept_master":"NURSING","mobile":"7096313610","other":"7096313610","email":"adityarajrathod27@gmail.com","omail":"","blood":"B+","gender":"male","marital":"Single","dob":"28-01-2004","join":"01-03-2025","worker":"Company Staff","emp":"Confirm","shift":"General shift- 9:00-5:30","skill":"SEMISKILLED","edu1":"qualification:GNM nursing, institute:skum nursing","branch":"Ahmedabad"},
  "e003": {"id":"e003","code":"201","name":"Alkaben Gomanbhai Patel","unit":"Communication Centre","desig":"Call Centre Executive","reports":"Sharon Girishbhai Christian","dept_master":"FRONT DESK","mobile":"9898635523","other":"9898635523","email":"amigohil02@gmail.com","omail":"","blood":"AB+","gender":"female","marital":"Married","dob":"15-04-1983","join":"01-06-2025","worker":"Company Staff","emp":"Confirm","shift":"General shift - 10:00-6:30","skill":"UNSKILLED","branch":"Ahmedabad"},
  "e004": {"id":"e004","code":"117","name":"Alpesh Ashokbhai Kanojiya","unit":"Radiology","desig":"Mri Technician","reports":"Dr. Preety Ajay Krishnan","dept_master":"MRI","mobile":"7984830412","other":"9106979665","email":"kanojiyaalpesh47@gmail.com","omail":"","blood":"AB+","gender":"male","marital":"Married","dob":"25-08-1981","join":"12-03-2016","worker":"Company Staff","emp":"Confirm","shift":"General shift - 7:00-3:30","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e005": {"id":"e005","code":"194","name":"Ami Vijaybhai Patni","unit":"IPD & HDU Nursing","desig":"Junior Nursing Staff","reports":"Manilal Mangilal Hadat","dept_master":"NURSING","mobile":"8128961359","other":"9106193025","email":"ameepatni7@gmail.com","omail":"","blood":"","gender":"female","marital":"Married","dob":"24-02-2004","join":"01-03-2025","worker":"Company Staff","emp":"Confirm","shift":"Nursing Shift - 8:00am-2:00pm","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e006": {"id":"e006","code":"1","name":"Amita Bharat Dave","unit":"Governance","desig":"Co-Founder & Vice Chairperson","reports":"","dept_master":"GOVERNANCE","mobile":"9558771366","other":"9099597234","email":"amitadave11@gmail.com","omail":"","blood":"B+","gender":"female","marital":"Married","dob":"","join":"04-10-2004","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e007": {"id":"e007","code":"22","name":"Dr. Amritesh Singh","unit":"Junior Consultants","desig":"Junior Spine Consultant","reports":"Dr. Bharat Rajendraprasad Dave","dept_master":"SPINE","mobile":"7888326378","other":"8360398361","email":"amriteshsingh007@gmail.com","omail":"","blood":"A+","gender":"male","marital":"Married","dob":"26-09-1995","join":"08-08-2026","worker":"Company Staff","emp":"Probation","shift":"General shift","skill":"SKILLED","edu1":"qualification:M.B.B.S. Dayanand Medical College","branch":"Ahmedabad"},
  "e008": {"id":"e008","code":"139","name":"Anandkumar Jitendrabhai Harijn","unit":"OT Technicians","desig":"OT Technician · OT 4 endoscopy","reports":"Brijesh Hasmukhkumar Bhatt","note":"OT 4 is the endoscopy theatre","dept_master":"OT","mobile":"9328968838","other":"9328968838","email":"anandsolanki873@gmail.com","omail":"","blood":"B+","gender":"male","marital":"Single","dob":"09-12-2000","join":"14-02-2022","worker":"Company Staff","emp":"Confirm","shift":"Flexi Fixed Shift","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e009": {"id":"e009","code":"274","name":"Anita Punjalal Kothiwala","unit":"Radiology","desig":"Mt","reports":"Dr. Preety Ajay Krishnan","dept_master":"ADMIN","mobile":"9016555262","other":"7041871678","email":"anitakothiwala2@gmail.com","omail":"","blood":"B-","gender":"female","marital":"Married","dob":"","join":"21-04-2026","worker":"Company Staff","emp":"Confirm","shift":"General shift- 9:30-6:00","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e010": {"id":"e010","code":"123","name":"Anita Sunilbhai Gohel","unit":"Floor In-charges","desig":"Floor In-charge · 4th Floor","reports":"Manilal Mangilal Hadat","dept_master":"NURSING","mobile":"7016507186","other":"9998088544","email":"anitachristian32@gmail.com","omail":"","blood":"O+","gender":"female","marital":"Married","dob":"14-04-1986","join":"01-08-2018","worker":"Company Staff","emp":"Confirm","shift":"Nursing Shift - 8:00am-2:00pm","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e011": {"id":"e011","code":"192","name":"Anjali Gyaneshvar Jajjar","unit":"Front Desk","desig":"Front Desk Executive","reports":"Sharon Girishbhai Christian","dept_master":"FRONT DESK","mobile":"7874309850","other":"9913330527","email":"angeljajjar31@gmail.com","omail":"","blood":"O+","gender":"female","marital":"Married","dob":"04-04-1996","join":"24-02-2025","worker":"Company Staff","emp":"Confirm","shift":"General shift - 10:30-7:00","skill":"UNSKILLED","branch":"Ahmedabad"},
  "e012": {"id":"e012","code":"217","name":"Anjali Pravinbhai Gohil","unit":"IPD & HDU Nursing","desig":"Junior Nursing Staff","reports":"Manilal Mangilal Hadat","dept_master":"NURSING","mobile":"9510589992","other":"9316938458","email":"gohelanjali46@gmail.com","omail":"","blood":"O-","gender":"female","marital":"Single","dob":"16-08-2004","join":"01-11-2025","worker":"Company Staff","emp":"Confirm","shift":"Nursing Shift - 8:00am-2:00pm","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e013": {"id":"e013","code":"176","name":"Ankita Ankitkumar Panchal","unit":"Finance — Accounts","desig":"Finance Executive","reports":"Manthan Ajaybhai Mehta","dept_master":"FINANACE","mobile":"9773435582","other":"9558721812","email":"siddhapuraankita@gmail.com","omail":"","blood":"B+","gender":"female","marital":"Married","dob":"25-07-1989","join":"01-10-2024","worker":"Company Staff","emp":"Confirm","shift":"General shift- 9:00-5:30","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e014": {"id":"e014","code":"170","name":"Ankita Dharmin Doshi","unit":"Front Desk","desig":"Billing & Front Desk Executive","reports":"Sharon Girishbhai Christian","dept_master":"FRONT DESK","mobile":"6352774360","other":"7405412254","email":"Ank123itaparmar2510@gmail.com","omail":"","blood":"O+","gender":"female","marital":"Married","dob":"25-10-1996","join":"22-07-2024","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 8:30 hours","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e015": {"id":"e015","code":"216","name":"Arvindbhai Prahladbhai Padhiyar","unit":"Facility Operations","desig":"Facility Co-Ordinator","reports":"Zankhana Chirag Joshi","dept_master":"ADMIN","mobile":"7359302615","other":"9119381818","email":"arvind.p007123@gmail.com","omail":"","blood":"O+","gender":"male","marital":"Married","dob":"09-09-1979","join":"01-11-2025","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 8:30 hours","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e026": {"id":"e026","code":"185","name":"Brijesh Hasmukhkumar Bhatt","unit":"Nursing Leadership","desig":"CNO · ICN · NABH Lead","reports":"Dr. Mirant Bharat Dave","dept_master":"NURSING","mobile":"7486038894","other":"9426936222","email":"brijeshbhatt51@yahoo.in","omail":"","blood":"O+","gender":"male","marital":"Married","dob":"","join":"01-01-2025","worker":"Company Staff","emp":"Confirm","shift":"General Nursing Shift","skill":"SKILLED","edu1":"GNM Ayesha school of nursing","exp1":"nursing head and quality head Scai superspeciality hospital","branch":"Ahmedabad"},
  "e046": {"id":"e046","code":"15","name":"Dr. Preety Ajay Krishnan","unit":"Radiology","desig":"Radiologist · Head, Radiology","reports":"Dr. Mirant Bharat Dave","dept_master":"RADIOLOGY","mobile":"9824202768","other":"9824302768","email":"krishnanpreety@yahoo.com","omail":"","blood":"O+","gender":"female","marital":"Married","dob":"","join":"25-04-2016","worker":"Company Staff","emp":"Confirm","shift":"General shift - 7:30-4:00","skill":"SKILLED","branch":"Ahmedabad"},
  "e051": {"id":"e051","code":"13","name":"Dr. Ajay Krishnan","unit":"Consultant Spine Surgeons","desig":"Senior Spine Surgeon","reports":"Dr. Bharat Rajendraprasad Dave","dept_master":"SPINE","mobile":"9824302768","other":"9824202768","email":"drajaykrishnan@yahoo.com","omail":"","blood":"A+","gender":"male","marital":"Married","dob":"","join":"01-08-2008","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e055": {"id":"e055","code":"3","name":"Dr. Bharat Rajendraprasad Dave","unit":"Consultant Spine Surgeons","desig":"Founder & Chairman | Consultant Spine Surgeon","reports":"","dept_master":"FOUNDER & VICE CHAIRMAN","mobile":"9825019912","other":"9825701366","email":"brd_172@yahoo.com","omail":"","blood":"O+","gender":"male","marital":"Married","dob":"","join":"04-10-2004","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e057": {"id":"e057","code":"102","name":"Dr. Birju Kishorbhai Vyas","unit":"Spine Associates","desig":"Head, Spine Associates","reports":"Dr. Mirant Bharat Dave","dept_master":"PHYSIOTHRAPY","mobile":"7486038920","other":"9925244656","email":"birju_spine@yahoo.com","omail":"","blood":"B+","gender":"male","marital":"Married","dob":"","join":"26-05-2007","worker":"Company Staff","emp":"Confirm","shift":"Flexi Fixed Shift - 9","skill":"SKILLED","branch":"Ahmedabad"},
  "e059": {"id":"e059","code":"160","name":"Dr. Dhara Arvindkumar Panchal","unit":"Clinical Research","desig":"Head, Clinical Research","reports":"Dr. Akruti Mirant Dave","dept_master":"RESEARCH","mobile":"8866425868","other":"9099039777","email":"dhara51110@gmail.com","omail":"","blood":"B+","gender":"male","marital":"Married","dob":"","join":"19-02-2024","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 5 hours","skill":"SKILLED","branch":"Ahmedabad"},
  "e062": {"id":"e062","code":"11","name":"Dr. Kashyap Rameshchandra Shah","unit":"Anesthesia","desig":"Head, Anaesthesia","reports":"Dr. Mirant Bharat Dave","dept_master":"ANAESTHESIA","mobile":"9825047846","other":"9879408005","email":"hr@stavyaspine.com","omail":"","blood":"","gender":"male","marital":"Married","dob":"","join":"10-04-2004","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e069": {"id":"e069","code":"4","name":"Dr. Mirant Bharat Dave","unit":"Consultant Spine Surgeons","desig":"Managing Director | Consultant Spine Surgeon","reports":"","dept_master":"MANAGING DIRECTOR","mobile":"9099597234","other":"9825701366","email":"mirant@stavyaspine.com","omail":"","blood":"O+","gender":"male","marital":"Married","dob":"","join":"01-07-2022","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e073": {"id":"e073","code":"151","name":"Dr. Parth Janakbhai Joshi","unit":"Physiotherapy and Rehabilitation","desig":"Head, Physiotherapy & Rehabilitation","reports":"Dr. Mirant Bharat Dave","dept_master":"PHYSIOTHRAPY","mobile":"8488866392","other":"9998345278","email":"joshiparth543@gmail.com","omail":"","blood":"A+","gender":"male","marital":"Single","dob":"","join":"15-12-2022","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 8:30 hours","skill":"SKILLED","branch":"Ahmedabad"},
  "e077": {"id":"e077","code":"142","name":"Dr. Ravi Baldevbhai Patel","unit":"Clinical Coordinators","desig":"Head, Clinical Coordination","reports":"Dr. Mirant Bharat Dave","dept_master":"PHYSIOTHRAPY","mobile":"7486038895","other":"9725637605","email":"physioaim@gmail.com","omail":"","blood":"A-","gender":"male","marital":"Married","dob":"29-01-1989","join":"01-07-2022","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 10 hours","skill":"SKILLED","branch":"Ahmedabad"},
  "e081": {"id":"e081","code":"12","name":"Dr. Saunak Chaitanyaprasad Dudhiya","unit":"Medicine","desig":"Head, Medicine","reports":"Dr. Mirant Bharat Dave","dept_master":"PHYSICIAN","mobile":"9825096296","other":"9825060628","email":"hr@stavyaspine.com","omail":"","blood":"A-","gender":"male","marital":"Married","dob":"16-05-1963","join":"10-04-2004","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e099": {"id":"e099","code":"277","name":"Het Hasmukhkumar Bhatt","unit":"MD Office","desig":"AI Officer & Operations Lead","reports":"Dr. Mirant Bharat Dave","note":"MD Office Operations & Automation Lead","dept_master":"ADMIN","mobile":"9714234634","other":"8347777480","email":"hetbhatt10@gmail.com","omail":"","blood":"B+","gender":"male","marital":"Single","dob":"10-01-2004","join":"01-06-2026","worker":"Company Staff","emp":"Confirm","shift":"General shift - 8:30-5:00","skill":"SKILLED","branch":"Ahmedabad"},
  "e110": {"id":"e110","code":"143","name":"Jatin Jayentilal Pathak","unit":"Pharmacy","desig":"HOD Pharmacy","reports":"Dr. Mirant Bharat Dave","dept_master":"PHARMACY","mobile":"7486038917","other":"9979117942","email":"jatinpathak509@yahoo.com","omail":"","blood":"A+","gender":"male","marital":"Married","dob":"05-09-1968","join":"01-08-2022","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e131": {"id":"e131","code":"115","name":"Manilal Mangilal Hadat","unit":"Nursing Leadership","desig":"ANS · Assistant Nursing Superintendent","reports":"Brijesh Hasmukhkumar Bhatt","dept_master":"NURSING","mobile":"8511953624","other":"8233838923","email":"hadatmanilal511@gmail.com","omail":"","blood":"O+","gender":"male","marital":"Married","dob":"04-11-1988","join":"01-08-2015","worker":"Company Staff","emp":"Confirm","shift":"Nursing Shift - 8:00am-2:00pm","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e135": {"id":"e135","code":"112","name":"Manthan Ajaybhai Mehta","unit":"Finance — Accounts","desig":"Finance Manager","reports":"Nipa Shah","dept_master":"FINANACE","mobile":"9409624969","other":"9825369696","email":"manthanmehta26@gmail.com","omail":"manthan@stavyaspine.com","blood":"B+","gender":"male","marital":"Married","dob":"26-02-1994","join":"07-01-2014","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 6:30 hours","skill":"SKILLED","branch":"Ahmedabad"},
  "e145": {"id":"e145","code":"101","name":"Nipa Shah","unit":"Finance","desig":"CFO · Chief Financial Officer","reports":"Dr. Mirant Bharat Dave","dept_master":"FINANACE","mobile":"7486038890","other":"9825017688","email":"nipa@stavyaspine.com","omail":"","blood":"A+","gender":"female","marital":"Married","dob":"","join":"01-04-2005","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 7 hours","skill":"SKILLED","branch":"Ahmedabad"},
  "e150": {"id":"e150","code":"106","name":"Parimal Jayantilal Yagnik","unit":"Patient Experience","desig":"Head, Patient Experience","reports":"Rajiv Nair","dept_master":"FRONT DESK","mobile":"7486038893","other":"7984556917","email":"yagnikparimal@gmail.com","omail":"","blood":"A+","gender":"male","marital":"Married","dob":"23-04-1975","join":"01-09-2011","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 10 hours","skill":"SEMISKILLED","branch":"Ahmedabad"},
  "e152": {"id":"e152","code":"107","name":"Payal Manan Mehta","unit":"Human Resource","desig":"HR Head · Head of Human Resources","reports":"Dr. Mirant Bharat Dave","dept_master":"Human Resource","mobile":"9586105496","other":"9377285167","email":"payu281@yahoo.com","omail":"hr@stavyaspine.com","blood":"A+","gender":"female","marital":"Married","dob":"","join":"16-07-2011","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 4 hours","skill":"SKILLED","branch":"Ahmedabad"},
  "e165": {"id":"e165","code":"209","name":"Rajiv Nair","unit":"PECC Office","desig":"Head — PECC & Brand","reports":"Dr. Mirant Bharat Dave","dept_master":"MARKETING","mobile":"9820811722","other":"8879275721","email":"rajivnair@stavyaspine.com","omail":"","blood":"B+","gender":"male","marital":"Married","dob":"","join":"01-08-2025","worker":"Company Staff","emp":"Confirm","shift":"General shift","skill":"SKILLED","branch":"Ahmedabad"},
  "e179": {"id":"e179","code":"114","name":"Sharon Girishbhai Christian","unit":"Communication Centre","desig":"HOD Front Desk & Communication Centre","reports":"Rajiv Nair","dept_master":"FRONT DESK","mobile":"7486038896","other":"9712951853","email":"sadu_971992@yahoo.in","omail":"","blood":"O-","gender":"female","marital":"Married","dob":"09-07-1992","join":"01-06-2015","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 8:30 hours","skill":"UNSKILLED","branch":"Ahmedabad"},
  "e195": {"id":"e195","code":"255","name":"Vatsal Maheshkumar Vaghasiya","unit":"Infrastructure & Engineering","desig":"IT Head · Head of Infrastructure & Engineering","reports":"Dr. Mirant Bharat Dave","dept_master":"ADMIN","mobile":"9106882723","other":"7567651886","email":"vatsalstavya@gmail.com","omail":"","blood":"AB+","gender":"male","marital":"Single","dob":"10-01-1998","join":"01-04-2026","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 5 hours","skill":"SKILLED","branch":"Ahmedabad"},
  "e208": {"id":"e208","code":"110","name":"Zankhana Chirag Joshi","unit":"Facility Operations","desig":"CAO · Head, Facility Operations","reports":"Dr. Mirant Bharat Dave","dept_master":"ADMIN","mobile":"7486038892","other":"9925144195","email":"zankhana.joshi80@yahoo.com","omail":"","blood":"B+","gender":"female","marital":"Married","dob":"20-02-1980","join":"01-09-2012","worker":"Company Staff","emp":"Confirm","shift":"Flexi fixed shift - 7 hours","skill":"SKILLED","branch":"Ahmedabad"},
  // System aliases
  "usr-stav-101": {"id":"usr-stav-101","code":"118","name":"Priyesh Shah","unit":"Infrastructure & Engineering","desig":"Systems Engineer","reports":"Vatsal Maheshkumar Vaghasiya","dept_master":"ADMIN","mobile":"9825490625","email":"stavyan@stavya.local","gender":"male","join":"2023-05-01","worker":"Company Staff","emp":"Confirm","shift":"General Shift","skill":"SKILLED","branch":"Ahmedabad"},
};

export const STAVYA_ORG_STRUCTURE: HospitalOrgStructure = {
  governance: [
    { name: "Dr. Bharat Rajendraprasad Dave", title: "Founder & Chairman", role: "Spine Surgery Leadership" },
    { name: "Amita Bharat Dave", title: "Co-Founder & Vice Chairperson", role: "Executive Governance" },
    { name: "Dr. Mirant Bharat Dave", title: "Managing Director", role: "Hospital Leadership & Spine Surgeon" },
    { name: "Dr. Akruti Mirant Dave", title: "Director of Quality & Patient Safety", role: "Quality & Governance" },
  ],
  heads: {
    "Consultant Spine Surgeons": "Dr. Bharat Rajendraprasad Dave",
    "Junior Consultants": "Dr. Bharat Rajendraprasad Dave",
    "Spine Fellows": "Dr. Bharat Rajendraprasad Dave",
    "Medical Officers": "Dr. Mirant Bharat Dave",
    "Anesthesia": "Dr. Kashyap Rameshchandra Shah",
    "Medicine": "Dr. Saunak Chaitanyaprasad Dudhiya",
    "Radiology": "Dr. Preety Ajay Krishnan",
    "Physiotherapy and Rehabilitation": "Dr. Parth Janakbhai Joshi",
    "Spine Associates": "Dr. Birju Kishorbhai Vyas",
    "Clinical Coordinators": "Dr. Ravi Baldevbhai Patel",
    "Pharmacy": "Jatin Jayentilal Pathak",
    "Clinical Research": "Dr. Dhara Arvindkumar Panchal",
    "Nursing Leadership": "Brijesh Hasmukhkumar Bhatt",
    "Floor In-charges": "Manilal Mangilal Hadat",
    "IPD & HDU Nursing": "Manilal Mangilal Hadat",
    "OT Scrub Nurses": "Brijesh Hasmukhkumar Bhatt",
    "OT Circulating Nurses": "Brijesh Hasmukhkumar Bhatt",
    "OT Technicians": "Brijesh Hasmukhkumar Bhatt",
    "CSSD": "Brijesh Hasmukhkumar Bhatt",
    "MD Office": "Dr. Mirant Bharat Dave",
    "Quality": "Dr. Akruti Mirant Dave",
    "Facility Operations": "Zankhana Chirag Joshi",
    "Infrastructure & Engineering": "Vatsal Maheshkumar Vaghasiya",
    "Finance": "Nipa Shah",
    "Finance — Accounts": "Manthan Ajaybhai Mehta",
    "Human Resource": "Payal Manan Mehta",
    "PECC Office": "Rajiv Nair",
    "Communication Centre": "Sharon Girishbhai Christian",
    "Front Desk": "Sharon Girishbhai Christian",
    "Patient Experience": "Parimal Jayantilal Yagnik",
    "Admission": "Parimal Jayantilal Yagnik",
    "PROs": "Parimal Jayantilal Yagnik",
    "Patient Escorts": "Parimal Jayantilal Yagnik",
    "Food Services": "Dr. Akruti Mirant Dave",
  },
  clinical: [
    {
      type: "group",
      name: "Spine Surgery",
      head: "Dr. Bharat Rajendraprasad Dave",
      head_title: "Chief of Spine Surgery · reports to the Governing Body",
      children: [
        { type: "leaf", name: "Consultant Spine Surgeons" },
        { type: "leaf", name: "Junior Consultants" },
        { type: "leaf", name: "Spine Fellows" },
        { type: "leaf", name: "Medical Officers" },
      ],
    },
    {
      type: "group",
      name: "Clinical Departments",
      head: null,
      head_title: "Report to the Managing Director",
      children: [
        { type: "leaf", name: "Anesthesia" },
        { type: "leaf", name: "Radiology" },
        { type: "leaf", name: "Medicine" },
        { type: "leaf", name: "Physiotherapy and Rehabilitation" },
      ],
    },
    {
      type: "group",
      name: "Clinical Operations",
      head: null,
      head_title: "Report to the Managing Director",
      children: [
        { type: "leaf", name: "Clinical Coordinators" },
        { type: "leaf", name: "Spine Associates" },
        { type: "leaf", name: "Pharmacy" },
        { type: "leaf", name: "Clinical Research" },
      ],
    },
    {
      type: "group",
      name: "Nursing Services",
      head: "Brijesh Hasmukhkumar Bhatt",
      head_title: "CNO · ICN · NABH Lead",
      children: [
        { type: "leaf", name: "Nursing Leadership" },
        { type: "leaf", name: "Floor In-charges" },
        { type: "leaf", name: "IPD & HDU Nursing" },
        { type: "leaf", name: "OT Scrub Nurses" },
        { type: "leaf", name: "OT Circulating Nurses" },
        { type: "leaf", name: "OT Technicians" },
        { type: "leaf", name: "CSSD" },
      ],
    },
  ],
  admin: [
    { type: "leaf", name: "MD Office" },
    {
      type: "group",
      name: "Quality & Patient Safety",
      head: "Dr. Akruti Mirant Dave",
      head_title: "Director · independent line to the Board",
      children: [{ type: "leaf", name: "Quality" }],
    },
    {
      type: "group",
      name: "Facilities, Infrastructure & Engineering",
      head: null,
      head_title: "Facility Operations & IT Leadership",
      children: [
        { type: "leaf", name: "Facility Operations" },
        { type: "leaf", name: "Infrastructure & Engineering" },
      ],
    },
    {
      type: "group",
      name: "Finance",
      head: "Nipa Shah",
      head_title: "CFO",
      children: [
        { type: "leaf", name: "Finance" },
        { type: "leaf", name: "Finance — Accounts" },
      ],
    },
    { type: "leaf", name: "Human Resource" },
    {
      type: "group",
      name: "PECC — Patient Experience & Communication Centre",
      head: "Rajiv Nair",
      head_title: "Head, PECC & Brand",
      children: [
        { type: "leaf", name: "PECC Office" },
        { type: "leaf", name: "Communication Centre" },
        {
          type: "group",
          name: "Patient Experience",
          head: "Parimal Jayantilal Yagnik",
          head_title: "Head, Patient Experience",
          children: [
            { type: "leaf", name: "Patient Experience" },
            { type: "leaf", name: "Admission" },
            { type: "leaf", name: "PROs" },
            { type: "leaf", name: "Front Desk" },
            { type: "leaf", name: "Patient Escorts" },
          ],
        },
      ],
    },
    { type: "leaf", name: "Food Services" },
  ],
};

export function getAllVerifiedHospitalUsers() {
  return Object.values(STAVYA_STAFF_DATABASE).map(s => {
    const isMD = s.name.toLowerCase().includes('mirant') && s.name.toLowerCase().includes('dave');
    const isHead = Object.values(STAVYA_ORG_STRUCTURE.heads).some(h => h.toLowerCase() === s.name.toLowerCase());
    const role = isMD ? 'MD' : isHead ? 'LEADER' : 'STAVYAN';
    return {
      id: s.id,
      name: s.name,
      email: s.email || `${s.code.toLowerCase()}@stavyaspine.com`,
      role: role as any,
      roleTitle: s.desig,
      departmentId: `dept-${s.unit.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      departmentName: s.unit,
      roles: [role],
      permissions: isMD ? ['*'] : isHead ? ['dashboard.department.read', 'task.assign'] : ['task.create', 'task.complete'],
      organizationId: 'org-stavya-01',
    };
  });
}
