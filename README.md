# FindPrimers ([DEMO HERE](https://lepusdz.github.io/FindPrimers/))

FindPrimers is a web-based molecular biology tool developed to automate the process of designing PCR primers for restriction enzyme cloning. It incorporates algorithms for finding Open Reading Frames (ORF) and type II restriction enzyme recognition sequences in circular and in linear DNA inputs and for navigating between them; then it automates the selection of the restriction enzymes based on the compatibility between the proposed vector and insert, and then it produces the final design of the forward and the reverse primers.
This application is developed using Angular 17 and styled with Bootstrap, providing a robust and responsive user interface.

## Features
- **ORF Search Algorithm**: Similarly to NCBI ORFFinder or EXPASY Translate Tool, efficiently locates open reading frames in long genetic sequences.
- **Enzyme Search Algorithm**: Similarly to NEBCutter, identifies restriction enzyme recognition sequences in DNA and filters it to find sites available for restriction cloning.
- **One-Stop Tool**: Combines the key capabilities of the ORFFinder, NEBCutter, and SnapGene to enable a first-in-class “one-click” restriction cloning primer design.
- **User-Friendly Interface**: Built with Angular 17 and Bootstrap for a responsive and intuitive experience.

### Browser Compatibility
The application is optimized for the following web browsers:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge

### Limitations
- **Mobile Devices**: FindPrimers is currently not supported on mobile devices and will not function correctly on smartphones or tablets.
- **Safari Browser**: Please note that FindPrimers is currently not compatible with Safari and will not work as intended in this browser.

## Live Demo
Experience FindPrimers in action: [DEMO HERE](https://lepusdz.github.io/FindPrimers/)

## Setup and Installation

### Prerequisites
Ensure you have the following installed:
- Node.js
- Angular CLI

### Installation Steps
1. **Clone the Repository**
   Clone or download the FindPrimers repository to your local machine.

2. **Install Dependencies**
   Navigate to the cloned directory and run the following commands:
   ```bash
   npm install
3. **Run the Application**
   Once the dependencies are installed, start the application using:
   ```bash
   ng serve
4. **Access the Application**
The application will be running at [http://localhost:4200/](http://localhost:4200/). Open this URL in your browser to start using FindPrimers.

### Contributions
Contributions to the FindPrimers project are welcome. Please follow the standard procedures for submitting issues or pull requests on GitHub.
