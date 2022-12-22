import React,{ useState, useEffect } from "react";
import { useLocation } from "react-router-dom"

const lbeTable = require('@site/static/assets/lbe.json');

// Lookup for JSON attributes corresponding to type

const filterAttr = {
  "subd": "subdiscipline",
  "journal": "journal",
  "repo": "linkdata",
  "doi": "linkpub"
};

function MultiUrl( {name,url} ) {
  return (
    <button className="lbe__block__link">
      <a href={url} target="_blank">{name}</a>
    </button>
  )
}

// Handles text input

function TextSearch( { lbeState, setLbeState, resultOutput } ) {

  const handleChange = e => setLbeState({search: e.target.value, subd: "", repo: "", journal: "", switch: "search"},[e.target.value]);

  return(
    <div className="lbe__searchfilter__search">
      <input className="navbar__search-input" placeholder="Type to search" value={lbeState.search} onChange={handleChange} /> &ensp; <em>{resultOutput}</em>
    </div>
  )
}

// Function for expandible author list

function Authors( { authors, length } ) {

  const [listOpen,ToggleListOpen] = useState(false); // Define state for author list, default "false"
  var shortlist = authors.split(", ",length).join(", ");   // List of authors with elements given by length

  // If there are less than {length} authors, do not display button

  if ( shortlist == authors ) {
    return (
      <React.Fragment>{authors}</React.Fragment>
    )
  }

  else if (listOpen) {
    return(
      <React.Fragment>{authors} <button className="lbe__block__author-trigger" onClick={() => ToggleListOpen(!listOpen)}>&#9650; collapse</button></React.Fragment> 
    )
  }

  else return (
    <React.Fragment>{shortlist}, ... <button className="lbe__block__author-trigger" onClick={() => ToggleListOpen(!listOpen)}>show all &#9660;</button></React.Fragment>
  )
}


// Function for handling button clicks

function HandleClick( {name,newState,setLbeState} ) {
  if (name == "All") {
    setLbeState({journal: "All", subd: "All", repo: "All", search: "", switch: "subd"});
  } else {
    setLbeState(newState);
  }
}


// Function for filtering buttons

function FilterButton( {type, name, numbered, lbeState, setLbeState} ) { // type and name are strings, numbered is boolean

  // Initialize variables

  var buttonClass = "lbe__filterbutton";
  var number = 0;
  var label = "";

  // Define how the state object should be set when clicked

  var newState={[type]: name, switch: type};
  
  // Styling of active button

  if (name === lbeState[type]) {  
    buttonClass = "lbe__filterbutton lbe__filterbutton--active";
  }

  // Determine number (when needed)

  if (numbered) {
    if (name === "All") {
      number = lbeTable.length;
    } else {
      number = lbeTable.map(m => JSON.stringify(m[filterAttr[type]])).filter(m => m.includes(name)).length;
    }
    label = name + " (" + number + ")";  
  } else {
    label = name;
  }

  return (
    <button 
      className={buttonClass}
      onClick={() => HandleClick( {...{name,newState,setLbeState}} )} 
    >
      {label}
    </button>
  )
}


// Function for single lbe dataset block

function LbeBlock( { title, authors, journal, pubyear, linkpub, linkdata, linkcomment, description, lbeState, setLbeState } ) {

  var doi = linkpub.slice(linkpub.indexOf("doi.org")+8); // Extract DOI from link by cutting right of "doi.org"    
  var myRepos = Array.from(new Set(linkdata.map(obj => obj.name))).flat().sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));  // Define set of repos in this dataset

  return (
    <div className="lbe__block">
      <div className="lbe__block__header">
        <div className="lbe__block__header__title"><h3>{title}</h3></div>
        <div className="lbe__block__header__link"><MultiUrl name="Permalink" url={"./?doi=".concat(doi)} /></div>
      </div>

      <p><em><Authors {...{authors}} length={10} /></em></p>

      <p><em>{journal}</em> <strong>{pubyear}</strong>, DOI: <a href={linkpub} target="_blank">{doi}</a>.</p>
      
      <p>{myRepos.map((m,idx) => 
          <FilterButton key={idx} name={m} type="repo" numbered={false} {...{lbeState, setLbeState}} />
        )}
      </p>

      <details className="lbe__details">

        <summary>Details</summary>

        <div className="lbe__details--collapsible">
          
          <h4>Description</h4>

          <p>{description}</p>

          <h4>Links to datasets</h4>

          <p>
            {linkdata.map((props, idx) => (
              <MultiUrl key={idx} {...props} />
            ))}
          </p>
          <p><em>{linkcomment}</em></p>

        </div>        
      </details>
    </div>
  );
}


// Assemble buttons for filtering section

function LbeButtons( {repos, subdiscs, journals, lbeState, setLbeState} ) {
  return(
    <React.Fragment>
      <div className="lbe__searchfilter__section"><h4>Filter by repositories</h4><p>{repos.map((props, idx) => <FilterButton key={idx} name={props} type="repo" numbered={true} {...{lbeState, setLbeState}} />)}</p></div>
      <div className="lbe__searchfilter__section"><h4>Filter by subdisciplines</h4><p>{subdiscs.map((props, idx) => <FilterButton key={idx} name={props} type="subd" numbered={true} {...{lbeState, setLbeState}} />)}</p></div>
      <div className="lbe__searchfilter__section"><h4>Filter by journals</h4><p>{journals.map((props, idx) => <FilterButton key={idx} name={props} type="journal" numbered={true} {...{lbeState, setLbeState}} />)}</p></div>
    </React.Fragment>
  )
}


// Render LBE section

function LbeRender( { list, lbeState, setLbeState } ) {
  return(
    <React.Fragment>
      {list.map((props, idx) => (
        <LbeBlock key={idx} {...props} {...{lbeState, setLbeState}} />
      ))}
    </React.Fragment>
  )
}


export default function Lbe( {useCategoriesList} ) {

  // Get URL params

  const location = useLocation()
  const queryParameters = new URLSearchParams(location.search);
  const queryText = queryParameters.get("text");
  const queryDoi = queryParameters.get("doi");

  // Define React state object

  const [lbeState, setLbeState] = useState({
    repo: "",
    subd: "",
    journal: "",
    search: "",
    switch: ""
  });

  // Conditions for initial states

  if (queryText !== null) {
    useEffect(() => {setLbeState({search: queryText, switch: "text"}); },[]);
  } else if (queryDoi !== null) {
    useEffect(() => {setLbeState({switch: "doi"}); },[]);
  } else {
    useEffect(() => {setLbeState({repo: "All", subd: "All", journal: "All", search: "", switch: "subd"})},[]);
  }

  // Get list of subdisciplines

  var subdiscs = Array.from(new Set(lbeTable.map(obj => obj.subdiscipline).flat())).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  subdiscs.unshift("All"); // Add "All" option at the beginning

  // Get list of tags

  var categories = Array.from(new Set(lbeTable.map(obj => obj.tags).flat())).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  categories.unshift("All"); // Add "All" option at the beginning
  
  // Get list of journals
  
  var journals = Array.from(new Set(lbeTable.map(obj => obj.journal))).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  journals.unshift("All"); // Add "All" option at the beginning
  
  // Get list of repos
  
  var repos = Array.from(new Set(lbeTable.map(obj => obj.linkdata.map(obj => obj.name)).flat())).sort((a, b) => a.localeCompare(b, undefined, {sensitivity: 'base'}));
  repos.unshift("All"); // Add "All" option at the beginning


  // Render all datasets if "All" is selected

  if (lbeState.repo == "All" || lbeState.subd == "All") {
    return(
      <div className="lbe">
        <div className="lbe__searchfilter">
          <div className="lbe__searchfilter__container">
            <TextSearch {...{lbeState,setLbeState,resultOutput}} />
            <LbeButtons {...{repos, subdiscs, journals, lbeState, setLbeState}} />
          </div>
        </div>
        <div className="lbe__body"><LbeRender list={lbeTable} {...{lbeState, setLbeState}} /></div> 
      </div>
    )
  }

  // Determine result set based on lbeState.switch states

  var result = [];

  switch ( lbeState.switch ) {
    case "tag":
      result = lbeTable.filter(n => n.tags.includes(tagFilter));
      break;
    case "repo":
      result = lbeTable.filter(n => n.linkdata.map(n => n.name).includes(lbeState.repo));
      break;
    case "subd":
      result = lbeTable.filter(n => n.subdiscipline.includes(lbeState.subd));
      break;
    case "journal":
      result = lbeTable.filter(n => n.journal.includes(lbeState.journal));
      break;
    case "search":
      result = lbeTable.filter(obj => JSON.stringify(obj).toLowerCase().includes(lbeState.search.toLowerCase()));   // Squash object with JSON.stringify() for better searchability
      if ( lbeState.search == "" ) {
        var resultOutput = "";
      } else if (result.length == 1) {
        var resultOutput = result.length+" entry found...";
      } else {
        var resultOutput = result.length+" entries found...";
      }
      break;
    case "doi":
      result = lbeTable.filter(n => n.linkpub.includes(queryDoi));  
  }

  return (
    <div className="lbe">
      <div className="lbe__searchfilter">
        <div className="lbe__searchfilter__container">
            <TextSearch {...{lbeState,setLbeState,resultOutput}} />
            <LbeButtons {...{repos, subdiscs, journals, lbeState, setLbeState}} />
        </div>
      </div>
      <div className="lbe__body"><LbeRender list={result} {...{lbeState, setLbeState}} /></div> 
    </div>
  )
}

