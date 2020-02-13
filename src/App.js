import React, { Component } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import { connect } from 'react-redux';

import PlaylistForm from './components/PlaylistForm';
import LoginPage from './components/Login';
import { setAccessToken, setUserId, updateSongList } from './redux/actions';
import NavBar from './components/NavBar';
import SideBar from './components/SideBar';
import Colors from './components/data/Colors';

class App extends Component {
  static propTypes = {
    cookies: instanceOf(Cookies).isRequired,
  };

  constructor(props) {
    super(props);
    const { cookies } = this.props;
    this.state = { accessToken: cookies.get('access_token') || null };
  }

  componentWillMount() {
    const { cookies } = this.props;
    // query param of log-in url for access token
    const params = new URLSearchParams(window.location.hash.slice(1));
    let accessToken = params.get('access_token');

    if (accessToken) {
      cookies.set('access_token', accessToken);
      // cannot use reload here
      window.location = window.location.pathname;
      // set the accessToken to global store
    }

    accessToken = cookies.get('access_token');
    this.setState({ accessToken });
    this.handleAccessToken();

    // set handles
    axios.get('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => {
      const { data } = res;
      this.setState({ id: data.id });
      this.handleUserId();
      this.getNewReleases(accessToken); // maybe switch to async/await
    }).catch((e) => {
      if (e.response.status === 401 && accessToken != null) {
        console.log('Token has expired, logging out');
        cookies.remove('access_token');
        window.location.reload();
      }
    });
  }

  getNewReleases(accessToken) {
    axios.get('https://api.spotify.com/v1/playlists/37i9dQZF1DWXT8uSSn6PRy', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then((res) => {
      this.handleUpdateSongs(this.filterPlaylist(res.data.tracks.items));
    }).catch((error) => {
      console.log(error);
    });
  }

  filterPlaylist(playlist) {
    return playlist.map(trackObj => ({
      name: trackObj.track.name,
      trackId: trackObj.track.id,
      artistId: trackObj.track.artists[0].id,
      imageUrl: trackObj.track.album.images[0].url,
      selected: false,
    }));
  }


  logout() {
    const { cookies } = this.props;
    console.log('Logging out');
    cookies.remove('access_token');
    this.setState({ accessToken: '' });
    this.handleAccessToken();
    this.handleUserId();
    window.location.reload();
  }

  handleAccessToken = () => {
    const { accessToken } = this.state;
    this.props.setAccessToken(accessToken);
  }

  handleUserId = () => {
    const { id } = this.state;
    this.props.setUserId(id);
  }

  handleUpdateSongs = (songs) => {
    this.props.updateSongList(songs);
  }

  renderLogin() {
    return (
      <LoginPage />
    );
  }

  renderMain(name) {
    return (
      <MainContainer>
        <NavBar
          name={name}
          logout={this.logout.bind(this)}
        />
        <ContentContainer>
          <SideBar />
          <PlaylistForm />
        </ContentContainer>
      </MainContainer>
    );
  }

  render() {
    const { accessToken } = this.state;
    return (
      <Container>
        {!accessToken && this.renderLogin()}
        {accessToken && this.renderMain()}
      </Container>
    );
  }
}

const Container = styled.div`
  display: block;
  width: 100vw;
  height: 100vh;
`;

const MainContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: ${Colors.spotifyGrey};
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: stretch;
  height: 100%;
`;

export default connect(null, { setAccessToken, setUserId, updateSongList })(withCookies(App));
