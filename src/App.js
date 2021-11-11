import { Component } from 'react';
import Navigation from './Components/Navigation/Navigation';
import Logo from './Components/Logo/Logo';
import ImageLinkForm from './Components/ImageLinkForm/ImageLinkForm';
import FaceRecognition from './Components/FaceRecognition/FaceRecognition';
import Signin from './Components/Signin/Signin';
import Register from './Components/Register/Register';
import Rank from './Components/Rank/Rank'
import Particles from 'react-particles-js';
import './App.css';

const particlesOptions = {
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        value_area: 800
      }
    }
  }
}

function initRequestOptions(formUrl) {
  //Clarifai init
  const raw = JSON.stringify({
    "user_app_id": {
      "user_id": "kevsely",
      "app_id": "f92ad747e4c44a248b810c187ba4164c"
    },
    "inputs": [
      {
        "data": {
          "image": {
            "url": formUrl
          }
        }
      }
    ]
  });

  const requestOptions = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Key b2dfced0cc0a415d8c23457948834eb6'
    },
    body: raw
  };

  return requestOptions;
}

function calculateBoxesParams(data) {
  const rawData = JSON.parse(data, null, 2).outputs[0].data.regions[0].region_info.bounding_box;

  //Grabbing box data
  const boxData = {
    top: (rawData.top_row * 100).toString() + '%',
    bottom: ((1 - rawData.bottom_row) * 100).toString() + '%',
    left: (rawData.left_col * 100).toString() + '%',
    right: ((1 - rawData.right_col) * 100).toString() + '%'
  };

  return boxData;
}

const initialState = {
  input: "",
  formUrl: "",
  box: {},
  route: 'signin',
  isSignedIn: false,
  user: {
    id: '',
    name: '',
    email: '',
    entries: 0,
    joined: '',
  }
}

class App extends Component {
  constructor() {
    super();
    this.state = initialState;
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined,
    }})
  }

  setFaceBox = (box) => { this.setState({ box }) }

  onInputChanges = (event) => {
    this.setState({ input: event.target.value });
  }

  onButtonSubmit = () => {
    this.setState({ formUrl: this.state.input });

    fetch("https://api.clarifai.com/v2/models/f76196b43bbd45c99b4f3cd8e8b40a8a/outputs", initRequestOptions(this.state.input))
      .then(response => response.text())
      .then(result => calculateBoxesParams(result))
      .then(box => this.setFaceBox(box))
    // .catch(error => console.log('error', error));

    fetch('https://damp-fjord-39973.herokuapp.com/image', {
      method: 'put',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        id: this.state.user.id
      })
    })
    .then(response => response.json())
    .then(count => {
      this.setState(Object.assign(this.state.user, {entries: count}))
    })
  }

  onRouteChange = (route) => {
    if (route === 'signin' || route === 'register') {
      this.setState(initialState);
    } else if (route === 'home') {
      this.setState({ isSignedIn: true })
    }
    this.setState({ route: route });
  }

  render() {
    const { formUrl, box, route, isSignedIn, user } = this.state;
    return (
      < div className="App" >
        <Particles className="particle" params={particlesOptions} />
        <Navigation onRouteChange={this.onRouteChange} isSignedIn={isSignedIn} />
        {route === 'home' ? 
          <div>
            <Logo />
            <Rank name={user.name} entries={user.entries}/>
            <ImageLinkForm
              onInputChanges={this.onInputChanges}
              onButtonSubmit={this.onButtonSubmit}
            />
            <FaceRecognition box={box} imageUrl={formUrl} />
          </div>
          : (route === 'signin'
            ? <Signin onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
            : <Register onRouteChange={this.onRouteChange} loadUser={this.loadUser}/>
          )

        }
      </div >
    )
  }
}

export default App;
