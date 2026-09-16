const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'components', 'HowWorks.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldSteps = `const steps = [
  {
    id: 1,
    title: "Choose Device",
    desc: "Select from our premium range.",
    icon: PackageSearch,
    accent: "56, 189, 248", // sky
  },
  {
    id: 2,
    title: "Professional Installation",
    desc: "Expert setup with zero damage.",
    icon: Wrench,
    accent: "139, 92, 246", // violet
  },
  {
    id: 3,
    title: "Connect Mobile App",
    desc: "Sync devices seamlessly.",
    icon: SmartphoneNfc,
    accent: "217, 70, 239", // fuchsia
  },
  {
    id: 4,
    title: "Enjoy Smart Living",
    desc: "Experience true automation.",
    icon: Sparkles,
    accent: "251, 191, 36", // amber
  },
];`;

const newSteps = `const steps = [
  {
    id: 1,
    titleKey: "howWorks.step1.title",
    descKey: "howWorks.step1.desc",
    icon: PackageSearch,
    accent: "56, 189, 248",
  },
  {
    id: 2,
    titleKey: "howWorks.step2.title",
    descKey: "howWorks.step2.desc",
    icon: Wrench,
    accent: "139, 92, 246",
  },
  {
    id: 3,
    titleKey: "howWorks.step3.title",
    descKey: "howWorks.step3.desc",
    icon: SmartphoneNfc,
    accent: "217, 70, 239",
  },
  {
    id: 4,
    titleKey: "howWorks.step4.title",
    descKey: "howWorks.step4.desc",
    icon: Sparkles,
    accent: "251, 191, 36",
  },
];`;

content = content.replace(oldSteps, newSteps);

// Update step.title and step.desc references in JSX
content = content.replace(/\{step\.title\}/g, '{t(step.titleKey)}');
content = content.replace(/\{step\.desc\}/g, '{t(step.descKey)}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('HowWorks.jsx updated successfully');
