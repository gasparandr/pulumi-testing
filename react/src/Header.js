import React, { useEffect } from 'react';
import Jumbotron from 'react-bootstrap/Jumbotron';

const Header = () => {
  useEffect(() => {
    fetch(`${process.env.REACT_APP_REMOTE_ENDPOINT}/users`)
      .then((res) => res.text())
      .then(
        (result) => {
          console.log(
            `Get request to ---> ${process.env.REACT_APP_REMOTE_ENDPOINT}/users`
          );
          console.log('Response --->', result);
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        (error) => {
          console.error(error);
        }
      );
  }, []);

  return (
    <Jumbotron>
      <h1>Andrei</h1>
      <p>This is a description for the site.</p>
    </Jumbotron>
  );
};

export default Header;
