/*
This is the Best-Case example of the service!

Add a new hash to be merklized
*/

axios.post('https://merkl.io/add/', {
  hash: '0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14',
});

// timestamp serer signature

{
  signature: '0x...',
  timestamp: 190234824, // timestamp submitted
}

/*
Get hash status or proof
*/

axios.get('https://merkl.io/status/0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14');

// returns this

{
  status: 'pending',
}

// or

{
  status: 'transacted',
  masterHash: '0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14',
  proof: {
    '0xfb4918a34258835278c9e4bbc6a653e4635a1727567e71bb5f5bc90cd4182fbf': {
      '0x11105bb2d695e056d31777f0ce726de0335ff66a3f66ece9ab91f7b89a788bc2': [
        '0x26b74a107f953ab5e3aac2dcde97126224fe6c7da163782bba6372b3deaf1a14',
        '0x3c8df9b2c11aa3d7fc06ef9f45e9c571e024ab5747121787d1dfdf5e251fcef0',
      ],
    },
  };
}
